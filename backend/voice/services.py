"""Voice Entry service layer.

Split into small, single-purpose services per the "don't build one giant
file" guidance:

- TransactionParser   — turns a transcript into structured, schema-shaped JSON
- ProductMatchingService — resolves a spoken product name against real inventory
- FinancialCalculationService — the ONLY place that computes revenue/cost/profit;
  the AI never gets to supply these numbers, only the backend's own product data does
"""
import difflib
import json
import logging

from expenses.models import Expense
from products.models import Product
from chat.openrouter_client import chat_completion, OpenRouterError

logger = logging.getLogger(__name__)

# Credit sales aren't supported by voice entry yet — they need a customer
# and due date collected, which this first slice (sale + expense only)
# doesn't have UI for. Restricting the parser's payment_method output keeps
# it from producing a proposal that would fail Sale validation on confirm.
SUPPORTED_TYPES = {'sale', 'expense', 'unclear'}
PAYMENT_METHODS = {'cash', 'mobile_money'}
EXPENSE_CATEGORIES = {c[0] for c in Expense.CATEGORY_CHOICES}

SYSTEM_PROMPT = """You are a transaction parser for Kapita, a small-business bookkeeping app used in Zambia.
A user has spoken a sentence describing something that happened in their business. Your ONLY job is
to convert that sentence into a single JSON object — nothing else, no prose, no markdown fences.

Only two transaction types are supported right now: "sale" and "expense". If the sentence describes
anything else (stock purchase, credit sale/payment, reinvestment, withdrawal, a question, small talk),
set transaction_type to "unclear" — this includes sales explicitly described as "on credit" or
"he'll pay later", since voice-recorded credit sales aren't supported yet.

Output EXACTLY this shape:
{
  "transaction_type": "sale" | "expense" | "unclear",
  "product_name": string or null,      // sale only — the product as the user said it, verbatim
  "quantity": number or null,          // sale only
  "unit_price": number or null,        // sale only — ONLY if the user stated a price per item
  "total_amount": number or null,      // sale: total if stated instead of per-item; expense: the amount
  "payment_method": "cash" | "mobile_money" | null,  // sale only, default null means unstated
  "customer_name": string or null,     // sale only, only if named
  "expense_category": one of [rent, utilities, airtime, transport, stock_purchase, marketing, salaries, personal_withdrawal, other] or null,
  "description": string or null,       // expense only — short label for the expense
  "confidence": number,                // 0.0-1.0, your genuine confidence this parse is correct and complete
  "missing_field": string or null      // name of the single most important missing/ambiguous field, or null
}

Rules:
- Zambian Kwacha is written "K" or "kwacha" — all amounts are in Kwacha, return plain numbers.
- Never invent a quantity, price, or amount that wasn't stated or clearly implied.
- If a required field (quantity for a sale, amount for an expense) is missing, set confidence low
  (below 0.5) and set missing_field to that field's name.
- "cash" is the default payment method only if the user's phrasing clearly implies an immediate,
  paid-in-full transaction with no other method mentioned — otherwise leave payment_method null.
"""


class TransactionParseError(Exception):
    pass


class TransactionParser:
    """Sends a transcript to the LLM and returns validated structured data.

    Never trusted for financial values beyond what the user actually said —
    FinancialCalculationService recomputes everything from real product data.
    """

    def parse(self, transcript: str) -> dict:
        transcript = (transcript or '').strip()
        if not transcript:
            raise TransactionParseError('Empty transcript')

        try:
            raw = chat_completion(system_prompt=SYSTEM_PROMPT, user_message=transcript)
        except OpenRouterError as exc:
            raise TransactionParseError(str(exc)) from exc

        data = self._extract_json(raw)
        return self._validate(data)

    def _extract_json(self, raw: str) -> dict:
        text = raw.strip()
        if text.startswith('```'):
            text = text.strip('`')
            if text.startswith('json'):
                text = text[4:]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start, end = text.find('{'), text.rfind('}')
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start:end + 1])
                except json.JSONDecodeError:
                    pass
            logger.warning('Voice parser: could not extract JSON from LLM response: %r', raw[:300])
            raise TransactionParseError('Could not understand the AI response. Please try again.')

    def _validate(self, data: dict) -> dict:
        if not isinstance(data, dict):
            raise TransactionParseError('Malformed AI response')

        transaction_type = data.get('transaction_type')
        if transaction_type not in SUPPORTED_TYPES:
            transaction_type = 'unclear'

        payment_method = data.get('payment_method')
        if payment_method not in PAYMENT_METHODS:
            payment_method = None

        expense_category = data.get('expense_category')
        if expense_category not in EXPENSE_CATEGORIES:
            expense_category = 'other' if transaction_type == 'expense' else None

        def _num(value):
            try:
                return float(value) if value is not None else None
            except (TypeError, ValueError):
                return None

        confidence = _num(data.get('confidence'))
        confidence = max(0.0, min(1.0, confidence)) if confidence is not None else 0.0

        return {
            'transaction_type': transaction_type,
            'product_name': (data.get('product_name') or '').strip() or None,
            'quantity': _num(data.get('quantity')),
            'unit_price': _num(data.get('unit_price')),
            'total_amount': _num(data.get('total_amount')),
            'payment_method': payment_method,
            'customer_name': (data.get('customer_name') or '').strip() or None,
            'expense_category': expense_category,
            'description': (data.get('description') or '').strip() or None,
            'confidence': confidence,
            'missing_field': data.get('missing_field'),
        }


class ProductMatchingService:
    """Resolves a spoken product name against the user's real inventory.
    Never guesses when there's more than one plausible match."""

    def match(self, user, product_name: str) -> dict:
        if not product_name:
            return {'status': 'not_found', 'matches': []}

        products = list(Product.objects.filter(user=user))
        name_lower = product_name.strip().lower()

        exact = [p for p in products if p.name.lower() == name_lower]
        if len(exact) == 1:
            return {'status': 'matched', 'product': exact[0], 'matches': []}

        contains = [p for p in products if name_lower in p.name.lower() or p.name.lower() in name_lower]
        if len(contains) == 1:
            return {'status': 'matched', 'product': contains[0], 'matches': []}
        if len(contains) > 1:
            return {'status': 'ambiguous', 'matches': contains[:6]}

        # High cutoff: this is for typos/plurals ("tomatoe" -> "Tomatoes"), not
        # loose fuzzy matching — a lower cutoff false-matches unrelated short
        # product names too easily (e.g. "mangoes" vs "tomatoes" ~0.67).
        close = difflib.get_close_matches(name_lower, [p.name.lower() for p in products], n=5, cutoff=0.8)
        if close:
            candidates = [p for p in products if p.name.lower() in close]
            if len(candidates) == 1:
                return {'status': 'matched', 'product': candidates[0], 'matches': []}
            return {'status': 'ambiguous', 'matches': candidates}

        return {'status': 'not_found', 'matches': []}


class FinancialCalculationService:
    """The only place allowed to produce authoritative revenue/cost/profit numbers.
    Always derives them from the real Product record, never from the AI's output."""

    def calculate_sale(self, product: Product, quantity: float, unit_price: float | None) -> dict:
        price = unit_price if unit_price is not None else float(product.selling_price)
        revenue = round(price * quantity, 2)
        cost = round(float(product.buying_price) * quantity, 2)
        profit = round(revenue - cost, 2)
        return {
            'unit_price': price,
            'total_amount': revenue,
            'cost_of_goods': cost,
            'estimated_profit': profit,
        }
