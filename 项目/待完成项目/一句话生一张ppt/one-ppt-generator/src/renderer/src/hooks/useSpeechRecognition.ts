import { useState, useCallback, useRef } from 'react'

export const useSpeechRecognition = (onResult: (text: string) => void) => {
    const [isRecording, setIsRecording] = useState(false)
    const recognitionRef = useRef<any>(null)

    const startRecording = useCallback(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert('您的浏览器不支持语音识别，请尝试使用 Chrome。')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = 'zh-CN'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
            let interimTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    onResult(event.results[i][0].transcript)
                } else {
                    interimTranscript += event.results[i][0].transcript
                }
            }
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            setIsRecording(false)
        }

        recognition.onend = () => {
            setIsRecording(false)
        }

        recognition.start()
        recognitionRef.current = recognition
        setIsRecording(true)
    }, [onResult])

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsRecording(false)
        }
    }, [])

    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }, [isRecording, startRecording, stopRecording])

    return { isRecording, toggleRecording }
}
