import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Square, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { chatAPI } from '../services/api'

export default function VoiceChat({ messages, addMessage, isLoading, setIsLoading }) {
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentAudio, setCurrentAudio] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const microphoneRef = useRef(null)

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const startListening = useCallback(async () => {
    try {
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
        await handleVoiceInput(audioBlob)
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop())
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        setAudioLevel(0)
      }

      mediaRecorder.start()
      setIsListening(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop())
    }
    setIsListening(false)
  }, [])

  const handleVoiceInput = async (audioBlob) => {
    try {
      setIsLoading(true)
      const sttResponse = await chatAPI.speechToText(audioBlob)
      const userText = sttResponse.data.text
      
      if (userText) {
        addMessage({ role: 'user', content: userText })
        
        // Get AI response
        const aiResponse = await chatAPI.sendMessage(userText, messages)
        const aiText = aiResponse.data.response
        addMessage({ role: 'assistant', content: aiText })
        
        // Speak the response
        await speakText(aiText)
      }
    } catch (error) {
      console.error('Voice input error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = async (text) => {
    try {
      setIsPlaying(true)
      const response = await chatAPI.textToSpeech(text)
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      setCurrentAudio(audio)
      audio.play()
    } catch (error) {
      console.error('TTS error:', error)
      setIsPlaying(false)
    }
  }

  const stopSpeaking = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
      setIsPlaying(false)
    }
  }, [currentAudio])

  // Render visualizer
  const barCount = 30
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Create a wave-like pattern
    const baseHeight = 10 + (Math.sin(i * 0.5) * 5)
    const dynamicHeight = isListening 
      ? baseHeight + (audioLevel / 10) * 40 
      : baseHeight
    return {
      index: i,
      height: Math.max(10, Math.min(80, dynamicHeight))
    }
  })

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      {/* Visualizer */}
      <div className="flex items-end justify-center gap-1 h-24">
        {bars.map((bar) => (
          <div
            key={bar.index}
            className="w-2 bg-primary-500 rounded-full transition-all duration-75"
            style={{
              height: `${bar.height}px`,
              opacity: 0.4 + (bar.height / 80) * 0.6
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className="text-center">
        {isLoading ? (
          <p className="text-gray-500">Processing...</p>
        ) : isListening ? (
          <p className="text-primary-600 font-medium">Listening...</p>
        ) : isPlaying ? (
          <p className="text-primary-600 font-medium">Mumu is speaking...</p>
        ) : (
          <p className="text-gray-500">Tap the mic to talk to Mumu</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {isListening ? (
          <button
            onClick={stopListening}
            className="p-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all active:scale-95 shadow-lg"
          >
            <Square className="w-10 h-10" />
          </button>
        ) : isPlaying ? (
          <button
            onClick={stopSpeaking}
            className="p-6 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all active:scale-95 shadow-lg"
          >
            <VolumeX className="w-10 h-10" />
          </button>
        ) : (
          <button
            onClick={startListening}
            disabled={isLoading}
            className="p-6 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            <Mic className="w-10 h-10" />
          </button>
        )}
      </div>
    </div>
  )
}
