class AlarmSystem {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                          JSON.parse(sessionStorage.getItem('currentUser'));
        this.alarms = [];
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentAlarm = null;
        
        this.init();
    }

    async loadUserAlarms() {
        if (!this.currentUser) return [];
        
        try {
            // Try to load from backend first
            const response = await fetch(`http://localhost:3001/api/users/${this.currentUser.id}/alarms`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return result.alarms || [];
                }
            }
        } catch (error) {
            console.log('Backend alarm loading failed, using localStorage fallback');
        }
        
        // Fallback to localStorage
        const userAlarms = JSON.parse(localStorage.getItem(`alarms_${this.currentUser.id}`)) || [];
        return userAlarms;
    }

    async init() {
        this.updateCurrentTime();
        this.setupEventListeners();
        this.startClock();
        
        // Load alarms from backend
        this.alarms = await this.loadUserAlarms();
        this.renderAlarms();
        this.checkAlarms();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('alarmForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addAlarm();
        });

        // Modal buttons with immediate response - Mobile optimized
        const snoozeBtn = document.getElementById('snoozeBtn');
        const stopBtn = document.getElementById('stopBtn');

        // Add multiple event listeners for mobile compatibility
        ['click', 'touchstart', 'touchend'].forEach(eventType => {
            snoozeBtn.addEventListener(eventType, async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.snoozeAlarm();
            }, { passive: false });

            stopBtn.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.stopAlarm();
            }, { passive: false });
        });

        // Close modal when clicking outside with immediate response - Mobile optimized
        const alarmModal = document.getElementById('alarmModal');
        
        ['click', 'touchstart'].forEach(eventType => {
            alarmModal.addEventListener(eventType, (e) => {
                if (e.target.id === 'alarmModal') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.stopAlarm();
                }
            }, { passive: false });
        });

        // Test sound button
        document.getElementById('testSoundBtn').addEventListener('click', () => {
            this.testSound();
        });

        // Add keyboard shortcuts for alarm control
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying) {
                if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.stopAlarm();
                }
            }
        });

        // Mobile-specific: Add touch event listeners for better mobile response
        this.setupMobileTouchHandlers();
    }

    setupMobileTouchHandlers() {
        // Mobile-specific touch handling for immediate response
        const stopBtn = document.getElementById('stopBtn');
        const snoozeBtn = document.getElementById('snoozeBtn');
        const modal = document.getElementById('alarmModal');

        // Prevent default touch behaviors that might interfere
        [stopBtn, snoozeBtn, modal].forEach(element => {
            if (element) {
                element.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                }, { passive: false });
                
                element.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                }, { passive: false });
            }
        });

        // Immediate stop on touch for mobile - no long press needed
        stopBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.stopAlarm();
        }, { passive: false });

        stopBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopAlarm();
        }, { passive: false });
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('currentTime').textContent = timeString;
    }

    startClock() {
        setInterval(() => {
            this.updateCurrentTime();
            this.checkAlarms();
        }, 1000);
    }

    async addAlarm() {
        const timeInput = document.getElementById('alarmTime');
        const labelInput = document.getElementById('alarmLabel');
        
        const time = timeInput.value;
        const label = labelInput.value.trim() || 'Alarm';
        
        if (!time) {
            alert('Please select a time for the alarm.');
            return;
        }

        const alarm = {
            id: Date.now(),
            time: time,
            label: label,
            enabled: true,
            createdAt: new Date().toISOString()
        };

        this.alarms.push(alarm);
        await this.saveAlarms();
        this.renderAlarms();
        
        // Reset form
        timeInput.value = '';
        labelInput.value = '';
        
        // Show success message
        this.showNotification('Alarm added successfully!', 'success');
    }

    async deleteAlarm(id) {
        if (confirm('Are you sure you want to delete this alarm?')) {
            this.alarms = this.alarms.filter(alarm => alarm.id !== id);
            await this.saveAlarms();
            this.renderAlarms();
            this.showNotification('Alarm deleted!', 'success');
        }
    }

    async toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            await this.saveAlarms();
            this.renderAlarms();
            
            const status = alarm.enabled ? 'enabled' : 'disabled';
            this.showNotification(`Alarm ${status}!`, 'info');
        }
    }

    async saveAlarms() {
        if (!this.currentUser) return;
        
        try {
            // Save to backend first
            const response = await fetch(`http://localhost:3001/api/users/${this.currentUser.id}/alarms`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alarms: this.alarms
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save alarms to backend:', result.message);
            }
        } catch (error) {
            console.error('Error saving alarms to backend:', error);
        }
        
        // Also save to localStorage as backup
        localStorage.setItem(`alarms_${this.currentUser.id}`, JSON.stringify(this.alarms));
        await this.updateUserStats();
    }

    async updateUserStats() {
        if (!this.currentUser) return;
        
        try {
            // Update user stats on backend
            const response = await fetch(`http://localhost:3001/api/users/${this.currentUser.id}/stats`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alarmCount: this.alarms.length,
                    totalAlarms: this.alarms.length
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to update user stats:', result.message);
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    renderAlarms() {
        const alarmsList = document.getElementById('alarmsList');
        
        if (this.alarms.length === 0) {
            alarmsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No alarms set</h3>
                    <p>Add your first alarm using the form above!</p>
                </div>
            `;
            return;
        }

        alarmsList.innerHTML = this.alarms
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(alarm => this.createAlarmHTML(alarm))
            .join('');

        // Add event listeners to new elements
        this.alarms.forEach(alarm => {
            const toggleBtn = document.querySelector(`[data-toggle="${alarm.id}"]`);
            const deleteBtn = document.querySelector(`[data-delete="${alarm.id}"]`);
            
            if (toggleBtn) {
                toggleBtn.addEventListener('click', async () => await this.toggleAlarm(alarm.id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => await this.deleteAlarm(alarm.id));
            }
        });
    }

    createAlarmHTML(alarm) {
        const time = new Date(`2000-01-01T${alarm.time}`);
        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="alarm-item ${!alarm.enabled ? 'disabled' : ''}" data-id="${alarm.id}">
                <div class="alarm-info">
                    <div class="alarm-time">${timeString}</div>
                    <div class="alarm-label">${alarm.label}</div>
                </div>
                <div class="alarm-controls">
                    <div class="toggle-switch ${alarm.enabled ? 'active' : ''}" data-toggle="${alarm.id}"></div>
                    <button class="delete-btn" data-delete="${alarm.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        this.alarms.forEach(alarm => {
            if (alarm.enabled && alarm.time === currentTime && !this.isPlaying) {
                this.triggerAlarm(alarm);
            }
        });
    }

    triggerAlarm(alarm) {
        this.currentAlarm = alarm;
        this.isPlaying = true;
        
        // Show modal
        document.getElementById('alarmMessage').textContent = `${alarm.label} - ${alarm.time}`;
        document.getElementById('alarmModal').classList.add('show');
        
        // Play sound
        this.playAlarmSound();
        
        // Request notification permission and show notification
        this.showBrowserNotification(alarm);
    }

    playAlarmSound() {
        try {
            // Method 1: Try using Audio API with a simple beep
            this.playSimpleBeep();
        } catch (error) {
            console.error('Error playing alarm sound:', error);
            // Method 2: Fallback to Web Audio API
            this.playWebAudioBeep();
        }
    }

    playSimpleBeep() {
        // Create a simple beep using Audio constructor
        const audio = new Audio();
        
        // Create a beep sound using data URL
        const sampleRate = 44100;
        const duration = 0.5; // 500ms
        const frequency = 800; // 800Hz
        const samples = sampleRate * duration;
        
        // Create audio buffer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, samples, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // Generate sine wave
        for (let i = 0; i < samples; i++) {
            channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
        }
        
        // Create audio source and play
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
        // Store reference for stopping
        this.currentAudioSource = source;
        this.currentAudioContext = audioContext;
        
        // Repeat the beep every 1 second
        this.beepInterval = setInterval(() => {
            if (this.isPlaying) {
                const newSource = audioContext.createBufferSource();
                newSource.buffer = buffer;
                newSource.connect(audioContext.destination);
                newSource.start();
                this.currentAudioSource = newSource;
            }
        }, 1000);
    }

    playWebAudioBeep() {
        try {
            // Create audio context for better sound control
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();
            
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // Create a beeping sound
            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            this.oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.5);
            
            this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            
            this.oscillator.start();
            
            // Create a pulsing effect
            this.createPulseEffect();
            
        } catch (error) {
            console.error('Web Audio API failed:', error);
            // Final fallback: try to play a simple audio file
            this.playFallbackSound();
        }
    }

    createPulseEffect() {
        let time = this.audioContext.currentTime;
        
        const pulse = () => {
            if (!this.isPlaying) return;
            
            this.gainNode.gain.setValueAtTime(0.3, time);
            this.gainNode.gain.setValueAtTime(0, time + 0.1);
            this.gainNode.gain.setValueAtTime(0.3, time + 0.2);
            
            time += 0.5;
            setTimeout(pulse, 500);
        };
        
        pulse();
    }

    playFallbackSound() {
        try {
            // Create a simple beep using HTML5 Audio API
            const audio = new Audio();
            
            // Create a beep sound using oscillator and Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            
            // Repeat the beep
            this.fallbackInterval = setInterval(() => {
                if (this.isPlaying) {
                    const newOsc = audioContext.createOscillator();
                    const newGain = audioContext.createGain();
                    
                    newOsc.connect(newGain);
                    newGain.connect(audioContext.destination);
                    
                    newOsc.type = 'square';
                    newOsc.frequency.setValueAtTime(800, audioContext.currentTime);
                    newGain.gain.setValueAtTime(0.1, audioContext.currentTime);
                    
                    newOsc.start();
                    newOsc.stop(audioContext.currentTime + 0.3);
                }
            }, 1000);
            
        } catch (error) {
            console.error('All audio methods failed:', error);
            // Last resort: try to use browser's built-in alert sound
            this.playBrowserBeep();
        }
    }

    playBrowserBeep() {
        // Try to trigger browser's built-in beep sound
        try {
            // Method 1: Use console beep (works in some browsers)
            console.log('\x07');
            
            // Method 2: Try to play a very simple audio
            const audio = new Audio();
            audio.volume = 0.1;
            
            // Create a simple beep using data URL
            const beepData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
            audio.src = beepData;
            
            // Try to play it
            audio.play().then(() => {
                // If successful, repeat it
                this.browserBeepInterval = setInterval(() => {
                    if (this.isPlaying) {
                        audio.currentTime = 0;
                        audio.play().catch(e => console.error('Browser beep failed:', e));
                    }
                }, 2000);
            }).catch(e => {
                console.error('Browser beep failed:', e);
                // Final fallback: just show a visual alert
                this.showVisualAlert();
            });
            
        } catch (error) {
            console.error('Browser beep failed:', error);
            this.showVisualAlert();
        }
    }

    showVisualAlert() {
        // Visual alert when all audio methods fail
        const body = document.body;
        let flashCount = 0;
        const maxFlashes = 20;
        
        this.visualAlertInterval = setInterval(() => {
            if (this.isPlaying && flashCount < maxFlashes) {
                body.style.backgroundColor = flashCount % 2 === 0 ? '#ff0000' : '#ffffff';
                flashCount++;
            } else {
                clearInterval(this.visualAlertInterval);
                body.style.backgroundColor = '';
            }
        }, 500);
    }

    testSound() {
        // Test the sound functionality
        this.showNotification('Testing sound...', 'info');
        
        // Temporarily set playing state
        this.isPlaying = true;
        
        // Try to play sound
        this.playAlarmSound();
        
        // Stop after 3 seconds
        setTimeout(() => {
            this.isPlaying = false;
            this.stopAlarm();
            this.showNotification('Sound test completed!', 'success');
        }, 3000);
    }

    stopAlarm() {
        console.log('Stopping alarm immediately...');
        
        // Immediately set playing state to false
        this.isPlaying = false;
        this.currentAlarm = null;
        
        // Immediately hide modal first
        const modal = document.getElementById('alarmModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // Immediately clear all intervals
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
        }
        
        if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
            this.fallbackInterval = null;
        }
        
        if (this.browserBeepInterval) {
            clearInterval(this.browserBeepInterval);
            this.browserBeepInterval = null;
        }
        
        if (this.visualAlertInterval) {
            clearInterval(this.visualAlertInterval);
            this.visualAlertInterval = null;
        }
        
        // Immediately reset visual effects
        document.body.style.backgroundColor = '';
        
        // Stop all audio immediately
        this.stopAllAudioImmediately();
        
        // Mobile-specific: Force stop any remaining audio contexts
        this.forceStopMobileAudio();
        
        // Additional mobile-specific audio stopping with delays
        setTimeout(() => {
            this.forceStopMobileAudio(); // Call again after a short delay
        }, 100);
        
        // Force stop any remaining audio after another delay
        setTimeout(() => {
            this.forceStopMobileAudio(); // Final cleanup
        }, 500);
        
        console.log('Alarm stopped successfully');
        this.showNotification('Alarm stopped!', 'success');
    }

    forceStopMobileAudio() {
        // Enhanced mobile-specific audio stopping
        try {
            console.log('Force stopping mobile audio...');
            
            // Stop all oscillators and sources immediately
            if (this.oscillator) {
                try {
                    this.oscillator.stop();
                    this.oscillator.disconnect();
                } catch (e) {
                    console.log('Oscillator stop error:', e);
                }
                this.oscillator = null;
            }
            
            if (this.currentAudioSource) {
                try {
                    this.currentAudioSource.stop();
                    this.currentAudioSource.disconnect();
                } catch (e) {
                    console.log('Audio source stop error:', e);
                }
                this.currentAudioSource = null;
            }
            
            // Close all audio contexts
            if (this.audioContext) {
                try {
                    this.audioContext.close();
                } catch (e) {
                    console.log('Audio context close error:', e);
                }
                this.audioContext = null;
            }
            
            if (this.currentAudioContext) {
                try {
                    this.currentAudioContext.close();
                } catch (e) {
                    console.log('Current audio context close error:', e);
                }
                this.currentAudioContext = null;
            }
            
            // Force stop all audio elements with multiple methods
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.src = '';
                    audio.load();
                    audio.muted = true;
                    audio.volume = 0;
                } catch (e) {
                    console.log('Audio element stop error:', e);
                }
            });
            
            // Mobile-specific: Force create and close a new context to stop all audio
            if (window.AudioContext || window.webkitAudioContext) {
                try {
                    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                    tempContext.close();
                } catch (e) {
                    console.log('Temp context creation error:', e);
                }
            }
            
            // Force stop any remaining Web Audio API sources
            if (window.AudioContext || window.webkitAudioContext) {
                try {
                    const context = new (window.AudioContext || window.webkitAudioContext)();
                    const gainNode = context.createGain();
                    gainNode.gain.setValueAtTime(0, context.currentTime);
                    context.close();
                } catch (e) {
                    console.log('Web Audio API stop error:', e);
                }
            }
            
            // Mobile-specific: Force mute all audio
            document.body.style.setProperty('--audio-muted', 'true');
            
            // Mobile-specific: Force stop any remaining audio with user interaction
            if ('ontouchstart' in window) {
                // This is a mobile device - use more aggressive stopping
                try {
                    // Force create a silent audio context to override any playing audio
                    const silentContext = new (window.AudioContext || window.webkitAudioContext)();
                    const silentOscillator = silentContext.createOscillator();
                    const silentGain = silentContext.createGain();
                    
                    silentOscillator.connect(silentGain);
                    silentGain.connect(silentContext.destination);
                    
                    silentGain.gain.setValueAtTime(0, silentContext.currentTime);
                    silentOscillator.frequency.setValueAtTime(1, silentContext.currentTime);
                    
                    silentOscillator.start();
                    silentOscillator.stop(silentContext.currentTime + 0.1);
                    
                    setTimeout(() => {
                        try {
                            silentContext.close();
                        } catch (e) {
                            // Ignore errors
                        }
                    }, 200);
                } catch (e) {
                    console.log('Silent audio context error:', e);
                }
            }
            
            console.log('Mobile audio force stop completed');
            
        } catch (error) {
            console.error('Error in forceStopMobileAudio:', error);
        }
    }

    stopAllAudioImmediately() {
        try {
            // Stop oscillator immediately
            if (this.oscillator) {
                try {
                    this.oscillator.stop();
                } catch (e) {
                    // Ignore errors if already stopped
                }
                this.oscillator = null;
            }
            
            // Stop audio source immediately
            if (this.currentAudioSource) {
                try {
                    this.currentAudioSource.stop();
                } catch (e) {
                    // Ignore errors if already stopped
                }
                this.currentAudioSource = null;
            }
            
            // Close audio contexts
            if (this.audioContext) {
                try {
                    this.audioContext.close();
                } catch (e) {
                    // Ignore errors if already closed
                }
                this.audioContext = null;
            }
            
            if (this.currentAudioContext) {
                try {
                    this.currentAudioContext.close();
                } catch (e) {
                    // Ignore errors if already closed
                }
                this.currentAudioContext = null;
            }
            
            // Force stop all HTML5 audio elements
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.src = '';
                } catch (e) {
                    // Ignore errors
                }
            });
            
            // Force stop any remaining Web Audio API sources
            if (window.AudioContext || window.webkitAudioContext) {
                try {
                    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                    tempContext.close();
                } catch (e) {
                    // Ignore errors
                }
            }
            
        } catch (error) {
            console.error('Error in stopAllAudioImmediately:', error);
        }
    }

    emergencyStop() {
        console.log('Emergency stop triggered');
        // Force refresh the page as last resort
        if (confirm('Alarm stop failed. Refresh page to stop alarm?')) {
            window.location.reload();
        }
    }

    async snoozeAlarm() {
        if (!this.currentAlarm) return;
        
        // Stop current alarm
        this.stopAlarm();
        
        // Create snooze alarm (5 minutes later)
        const now = new Date();
        const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
        const snoozeTimeString = snoozeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const snoozeAlarm = {
            id: Date.now(),
            time: snoozeTimeString,
            label: `${this.currentAlarm.label} (Snoozed)`,
            enabled: true,
            createdAt: new Date().toISOString()
        };
        
        this.alarms.push(snoozeAlarm);
        await this.saveAlarms();
        this.renderAlarms();
        
        this.showNotification('Alarm snoozed for 5 minutes!', 'success');
    }

    async showBrowserNotification(alarm) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Alarm!', {
                body: `${alarm.label} - ${alarm.time}`,
                icon: '/favicon.ico',
                requireInteraction: true
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('Alarm!', {
                    body: `${alarm.label} - ${alarm.time}`,
                    icon: '/favicon.ico',
                    requireInteraction: true
                });
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the alarm system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AlarmSystem();
}); 