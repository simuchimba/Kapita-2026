import { useState, useEffect } from 'react'
import { User, Building, Lock, FileText } from 'lucide-react'
import Card from '../components/Card'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import { isClerkEnabled } from '../config/auth'

const emptyReceiptForm = {
  business_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  tin: '',
  vat_number: '',
  business_registration_number: '',
  receipt_tagline: 'Official proof of purchase',
  receipt_thank_you: 'Thank you for your purchase! We appreciate your business.',
  receipt_return_policy:
    'Return/Exchange Policy: Items may be returned within 7 days with proof of purchase, subject to inspection.',
  currency: 'ZMW',
}

export default function Settings() {
  const { user, updateProfile, fetchUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    currency: 'ZMW',
  })

  const [receiptData, setReceiptData] = useState(emptyReceiptForm)

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        business_name: user.business_name || '',
        currency: user.currency || 'ZMW',
      })
    }
  }, [user])

  useEffect(() => {
    if (activeTab !== 'receipt') return

    const loadReceiptSettings = async () => {
      setReceiptLoading(true)
      try {
        const response = await authAPI.getReceiptSettings()
        setReceiptData({ ...emptyReceiptForm, ...response.data })
      } catch (error) {
        console.error('Failed to load receipt settings:', error)
        setMessage({ type: 'error', text: 'Failed to load receipt settings' })
      } finally {
        setReceiptLoading(false)
      }
    }

    loadReceiptSettings()
  }, [activeTab])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleReceiptUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await authAPI.updateReceiptSettings(receiptData)
      await fetchUser()
      setMessage({ type: 'success', text: 'Receipt details saved. New receipts will use these details.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save receipt settings' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setMessage({ type: 'success', text: 'Password changed successfully' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.old_password?.[0] || 'Failed to change password',
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'receipt', name: 'Receipt Details', icon: FileText },
    { id: 'security', name: 'Security', icon: Lock },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-x-8 gap-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setMessage({ type: '', text: '' })
              }}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {activeTab === 'profile' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={user?.email || ''} disabled />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      )}

      {activeTab === 'business' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Settings</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="label">Business Name</label>
              <input
                type="text"
                className="input"
                value={profileData.business_name}
                onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
              >
                <option value="ZMW">ZMW - Zambian Kwacha</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      )}

      {activeTab === 'receipt' && (
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Customer Receipt Details</h3>
            <p className="mt-1 text-sm text-gray-600">
              These details appear on PDF receipts when you download them from Sales. Fill in anything
              that currently shows as &quot;Not provided&quot;.
            </p>
          </div>

          {receiptLoading ? (
            <p className="text-sm text-gray-500">Loading receipt settings...</p>
          ) : (
            <form onSubmit={handleReceiptUpdate} className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Business header</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Business name *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={receiptData.business_name}
                      onChange={(e) => setReceiptData({ ...receiptData, business_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Salesperson first name</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.first_name}
                      onChange={(e) => setReceiptData({ ...receiptData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Salesperson last name</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.last_name}
                      onChange={(e) => setReceiptData({ ...receiptData, last_name: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Business address</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={receiptData.address}
                      onChange={(e) => setReceiptData({ ...receiptData, address: e.target.value })}
                      placeholder="Street, city, country"
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={receiptData.phone}
                      onChange={(e) => setReceiptData({ ...receiptData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" value={receiptData.email} disabled />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Website</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.website}
                      onChange={(e) => setReceiptData({ ...receiptData, website: e.target.value })}
                      placeholder="https://yourbusiness.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Tax & registration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">TIN</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.tin}
                      onChange={(e) => setReceiptData({ ...receiptData, tin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">VAT number</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.vat_number}
                      onChange={(e) => setReceiptData({ ...receiptData, vat_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Business registration no.</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.business_registration_number}
                      onChange={(e) =>
                        setReceiptData({ ...receiptData, business_registration_number: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Receipt footer messages</h4>
                <div className="space-y-4">
                  <div>
                    <label className="label">Receipt tagline</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptData.receipt_tagline}
                      onChange={(e) => setReceiptData({ ...receiptData, receipt_tagline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Thank-you message</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={receiptData.receipt_thank_you}
                      onChange={(e) => setReceiptData({ ...receiptData, receipt_thank_you: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Return / exchange policy</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={receiptData.receipt_return_policy}
                      onChange={(e) =>
                        setReceiptData({ ...receiptData, receipt_return_policy: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Receipt Details'}
              </button>
            </form>
          )}
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          {isClerkEnabled ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Security</h3>
              <p className="text-sm text-gray-600">
                Password and sign-in methods are managed through your Clerk account. Use the
                account menu or Clerk profile to update your password or enable two-factor
                authentication.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                required
                className="input"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                required
                className="input"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                required
                className="input"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
