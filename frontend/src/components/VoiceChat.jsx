import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Square, Volume2, VolumeX, User } from 'lucide-react'
import { chatAPI } from '../services/api'

export default function VoiceChat({ messages, addMessage, isLoading, setIsLoading, buildConversationContext }) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const microphoneRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const synthesisRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel()
      }
    }
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        speechRecognitionRef.current = new SpeechRecognition()
        speechRecognitionRef.current.continuous = true
        speechRecognitionRef.current.interimResults = true
        speechRecognitionRef.current.lang = 'en-US'

        speechRecognitionRef.current.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            stopListening()
            handleVoiceInput(finalTranscript.trim())
          }
        }

        speechRecognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setError(`Speech recognition error: ${event.error}`)
          }
          stopListening()
        }

        speechRecognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis
    }
  }, [])

  const startListening = useCallback(async () => {
    try {
      setError(null)
      
      // Check if Speech Recognition is available
      if (!speechRecognitionRef.current) {
        // Fallback to MediaRecorder + alert if SpeechRecognition not available
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        microphoneRef.current = stream
        
        // Set up audio context for visualization
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        }
        const analyser = audioContextRef.current.createAnalyser()
        analyserRef.current = analyser
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(analyser)
        analyser.fftSize = 256

        // Start animation for visualization
        const updateVisualizer = () => {
          const bufferLength = analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength
          setAudioLevel(average)
          animationRef.current = requestAnimationFrame(updateVisualizer)
        }
        updateVisualizer()

        // Start recording
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await handleVoiceInputWithBackend(audioBlob)
          
          // Stop stream
          stream.getTracks().forEach(track => track.stop())
          
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
          }
          setAudioLevel(0)
        }

        mediaRecorder.start()
        setIsListening(true)
        return
      }

      // If SpeechRecognition is available, use that (better experience)
      setIsListening(true)
      speechRecognitionRef.current.start()

      // Also set up audio visualizer for feedback
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneRef.current = stream
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const analyser = audioContextRef.current.createAnalyser()
      analyserRef.current = analyser
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      const updateVisualizer = () => {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength
        setAudioLevel(average)
        animationRef.current = requestAnimationFrame(updateVisualizer)
      }
      updateVisualizer()

    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Could not access microphone. Please allow microphone access.')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (speechRecognitionRef.current && isListening) {
      try {
        speechRecognitionRef.current.stop()
      } catch (e) {
        // Ignore errors if it's already stopped
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop())
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsListening(false)
    setAudioLevel(0)
  }, [isListening])

  const handleVoiceInput = async (text) => {
    if (!text) return
    
    try {
      setError(null)
      setIsLoading(true)
      addMessage({ role: 'user', content: text })
      
      // Get AI response with proper context
      const nextMessages = [...messages, { role: 'user', content: text }]
      const aiResponse = await chatAPI.sendMessage(text, buildConversationContext(nextMessages))
      const aiText = aiResponse.data.response
      addMessage({ role: 'assistant', content: aiText })
      
      // Speak the response
      await speakText(aiText)
    } catch (error) {
      console.error('Voice input error:', error)
      const errorMsg = error.response?.data?.error || 'Sorry, I could not process your request.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInputWithBackend = async (audioBlob) => {
    // This is the fallback if browser SpeechRecognition isn't available
    try {
      setError(null)
      setIsLoading(true)
      const sttResponse = await chatAPI.speechToText(audioBlob)
      const userText = sttResponse.data.text
      
      if (userText) {
        addMessage({ role: 'user', content: userText })
        
        // Get AI response with proper context
        const nextMessages = [...messages, { role: 'user', content: userText }]
        const aiResponse = await chatAPI.sendMessage(userText, buildConversationContext(nextMessages))
        const aiText = aiResponse.data.response
        addMessage({ role: 'assistant', content: aiText })
        
        // Speak the response
        await speakText(aiText)
      }
    } catch (error) {
      console.error('Voice input error:', error)
      const errorMsg = error.response?.data?.error || 'Sorry, I could not process your request.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = async (text) => {
    try {
      setError(null)
      setIsSpeaking(true)

      // Use browser's built-in speech synthesis
      if (synthesisRef.current) {
        synthesisRef.current.cancel() // Stop any existing speech
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = 1.0
        utterance.pitch = 1.0
        
        utterance.onend = () => {
          setIsSpeaking(false)
        }
        
        utterance.onerror = () => {
          setIsSpeaking(false)
          setError('Could not play audio.')
        }

        synthesisRef.current.speak(utterance)
      } else {
        // Fallback to backend TTS if browser speech synthesis not available
        const response = await chatAPI.textToSpeech(text)
        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.onerror = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          setError('Could not play audio.')
        }

        audio.play()
      }
    } catch (error) {
      console.error('TTS error:', error)
      setError('Could not generate speech.')
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // Render visualizer
  const barCount = 64
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Create a wave-like pattern
    const baseHeight = 8 + (Math.sin(i * 0.3) * 4)
    const dynamicHeight = isListening 
      ? baseHeight + (audioLevel / 8) * 35 
      : baseHeight
    return {
      index: i,
      height: Math.max(8, Math.min(120, dynamicHeight))
    }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {message.role === 'user' ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <User className="h-4 w-4 text-primary-700" />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
                <Volume2 className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[min(100%,36rem)] px-4 py-3 text-sm leading-relaxed rounded-2xl ${
                message.role === 'user'
                  ? 'rounded-tr-md bg-primary-600 text-white shadow-sm shadow-primary-600/15'
                  : message.isError
                  ? 'rounded-tl-md border border-red-200 bg-red-50 text-red-800'
                  : 'rounded-tl-md border border-gray-100 bg-white text-gray-800 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Visualizer and controls */}
      <div className="border-t border-gray-100 bg-gray-50/80 p-6">
        {error && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-xs text-red-600 hover:text-red-800">
              Dismiss
            </button>
          </div>
        )}

        {/* Visualizer */}
        <div className="mb-6 flex items-end justify-center gap-0.5 h-28">
          {bars.map((bar) => (
            <div
              key={bar.index}
              className={`w-1 rounded-full transition-all duration-75 ${
                isListening 
                  ? 'bg-gradient-to-t from-primary-400 to-primary-600' 
                  : 'bg-gray-200'
              }`}
              style={{
                height: `${bar.height}px`,
                opacity: isListening ? 0.5 + (bar.height / 120) * 0.5 : 0.3
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="mb-6 text-center">
          {isLoading ? (
            <p className="text-gray-600 font-medium">Processing your request...</p>
          ) : isListening ? (
            <p className="text-primary-600 font-medium text-lg animate-pulse">Listening... Speak now!</p>
          ) : isSpeaking ? (
            <p className="text-primary-600 font-medium">Mumu is speaking...</p>
          ) : (
            <p className="text-gray-500">Tap the mic to talk to Mumu</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {isListening ? (
            <button
              onClick={stopListening}
              className="group p-7 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all active:scale-95 shadow-xl hover:shadow-red-500/30 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              <Square className="w-12 h-12" />
            </button>
          ) : isSpeaking ? (
            <button
              onClick={stopSpeaking}
              className="group p-7 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all active:scale-95 shadow-xl hover:shadow-gray-600/30 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              <VolumeX className="w-12 h-12" />
            </button>
          ) : (
            <button
              onClick={startListening}
              disabled={isLoading}
              className="group p-7 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full hover:from-primary-500 hover:to-primary-700 transition-all active:scale-95 shadow-xl hover:shadow-primary-500/30 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Mic className="w-12 h-12 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
