const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const output = document.getElementById('output');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en';
recognition.continuous = true;
recognition.interimResults = true;

let finalTranscript = '';
let isRecording = false;
let retryCount = 0;
const MAX_RETRIES = 3;

recognition.onstart = () => {
    isRecording = true;
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    output.textContent = 'Listening...';
};

recognition.onresult = async (event) => {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            await processTranscriptWithRetry(finalTranscript);
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
    output.textContent = finalTranscript + interimTranscript;
};

async function processTranscriptWithRetry(text, attempt = 0) {
    try {
        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            if (attempt < MAX_RETRIES && response.status === 500) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                return processTranscriptWithRetry(text, attempt + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        updateFeedback(result);
    } catch (error) {
        console.error('Processing error:', error);
        showError(`Analysis failed (Attempt ${attempt + 1}/${MAX_RETRIES})`);
    }
}

function updateFeedback(analysis) {
    const feedbacks = ['fluency', 'vocabulary', 'pronunciation', 'grammar', 'score'];
    feedbacks.forEach(type => {
        const element = document.getElementById(`${type}Feedback`);
        if (element) {
            element.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${analysis[type] || 'N/A'}`;
        }
    });
}

function showError(message) {
    const feedbacks = ['fluency', 'vocabulary', 'pronunciation', 'grammar', 'score'];
    feedbacks.forEach(type => {
        const element = document.getElementById(`${type}Feedback`);
        if (element) {
            element.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: Error`;
        }
    });
    output.textContent = message;
}

recognition.onerror = (event) => {
    console.error('Recognition error:', event.error);
    showError(`Recognition error: ${event.error}`);
    isRecording = false;
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
};

startRecordBtn.addEventListener('click', () => {
    finalTranscript = '';
    recognition.start();
});

stopRecordBtn.addEventListener('click', () => {
    recognition.stop();
    isRecording = false;
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
});
