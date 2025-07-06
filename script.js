class AlarmSystem {
    constructor() {
        // API base URL - supports both localhost and network access
        this.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3001/api' 
            : 'http://192.168.94.218:3001/api';
            
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                          JSON.parse(sessionStorage.getItem('currentUser'));
        this.alarms = [];
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentAlarm = null;
        this.selectedAudioFile = null; // Store selected audio file
        this.selectedProfileImage = null; // Store selected profile image
        this.currentProfileImage = null; // Store current profile image
        this.editingAlarm = null; // Store alarm being edited
        this.selectedEditAudioFile = null; // Store selected audio file for edit
        
        this.init();
    }

    async loadUserAlarms() {
        if (!this.currentUser) return [];
        
        try {
            // Load from backend
            const response = await fetch(`${this.API_BASE_URL}/users/${this.currentUser.id}/alarms`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('Loaded alarms from backend:', result.alarms);
                    return result.alarms || [];
                }
            }
        } catch (error) {
            console.error('Backend alarm loading failed:', error);
        }
        
        // Fallback to localStorage
        const userAlarms = JSON.parse(localStorage.getItem(`alarms_${this.currentUser.id}`)) || [];
        console.log('Loaded alarms from localStorage fallback:', userAlarms);
        return userAlarms;
    }

    async init() {
        // Ensure user session is loaded
        this.refreshUserSession();
        
        // Debug user session for troubleshooting
        this.debugUserSession();
        
        this.updateCurrentTime();
        this.setupEventListeners();
        this.startClock();
        
        // Load alarms from backend
        this.alarms = await this.loadUserAlarms();
        this.renderAlarms();
        this.checkAlarms();
        
        // Load profile picture
        this.loadProfilePicture();
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

        // Test custom sound button
        const testCustomSoundBtn = document.getElementById('testCustomSoundBtn');
        if (testCustomSoundBtn) {
            testCustomSoundBtn.addEventListener('click', () => {
                this.testCustomSound();
            });
        }

        // File selection for custom alarm sounds
        const selectSoundBtn = document.getElementById('selectSoundBtn');
        const alarmSoundFile = document.getElementById('alarmSoundFile');
        
        if (selectSoundBtn && alarmSoundFile) {
            selectSoundBtn.addEventListener('click', () => {
                alarmSoundFile.click();
            });
            
            alarmSoundFile.addEventListener('change', (e) => {
                this.handleAudioFileSelect(e);
            });
        }

        // Edit alarm form and buttons
        const editAlarmForm = document.getElementById('editAlarmForm');
        const editSelectSoundBtn = document.getElementById('editSelectSoundBtn');
        const editAlarmSoundFile = document.getElementById('editAlarmSoundFile');
        const editTestCustomSoundBtn = document.getElementById('editTestCustomSoundBtn');
        
        if (editAlarmForm) {
            editAlarmForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveEditAlarm();
            });
        }
        
        if (editSelectSoundBtn && editAlarmSoundFile) {
            editSelectSoundBtn.addEventListener('click', () => {
                editAlarmSoundFile.click();
            });
            
            editAlarmSoundFile.addEventListener('change', (e) => {
                this.handleEditAudioFileSelect(e);
            });
        }
        
        if (editTestCustomSoundBtn) {
            editTestCustomSoundBtn.addEventListener('click', () => {
                this.testEditCustomSound();
            });
        }

        // Repeat alarm options
        this.setupRepeatOptions();

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
        const repeatType = this.getRepeatType();
        const repeatDays = repeatType === 'weekly' ? this.getSelectedDays() : [];
        
        if (!time) {
            alert('Please select a time for the alarm.');
            return;
        }

        // Validate weekly selection
        if (repeatType === 'weekly' && repeatDays.length === 0) {
            alert('Please select at least one day for weekly repeat.');
            return;
        }

        const alarm = {
            id: Date.now().toString(),
            time: time,
            label: label,
            enabled: true,
            status: 'pending', // pending, triggered, snoozed, completed
            createdAt: new Date().toISOString(),
            triggeredAt: null,
            completedAt: null,
            snoozeCount: 0,
            lastSnoozeAt: null,
            customSound: null, // Store custom sound URL
            repeatType: repeatType,
            repeatDays: repeatDays,
            lastTriggeredDate: null // Track last triggered date for repeating alarms
        };

        // Add custom sound if selected
        if (this.selectedAudioFile) {
            try {
                const audioUrl = URL.createObjectURL(this.selectedAudioFile);
                alarm.customSound = audioUrl;
                alarm.customSoundName = this.selectedAudioFile.name;
            } catch (error) {
                console.error('Error creating audio URL:', error);
                this.showNotification('Error processing audio file', 'error');
            }
        }

        this.alarms.push(alarm);
        await this.saveAlarms();
        this.renderAlarms();
        
        // Reset form
        timeInput.value = '';
        labelInput.value = '';
        this.clearFileSelection();
        this.resetRepeatOptions();
        
        // Show success message
        this.showNotification('Alarm added successfully!', 'success');
    }

    async deleteAlarm(id) {
        if (confirm('Are you sure you want to delete this alarm?')) {
            const alarmToDelete = this.alarms.find(a => a.id === id);
            
            // Revoke object URL if custom sound exists
            if (alarmToDelete && alarmToDelete.customSound) {
                try {
                    URL.revokeObjectURL(alarmToDelete.customSound);
                } catch (error) {
                    console.error('Error revoking object URL:', error);
                }
            }
            
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
            const response = await fetch(`${this.API_BASE_URL}/users/${this.currentUser.id}/alarms`, {
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
            const response = await fetch(`${this.API_BASE_URL}/users/${this.currentUser.id}/stats`, {
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

        // Separate pending and completed alarms
        const pendingAlarms = this.alarms.filter(alarm => alarm.status === 'pending' && alarm.enabled);
        const completedAlarms = this.alarms.filter(alarm => alarm.status === 'completed' || !alarm.enabled);
        const triggeredAlarms = this.alarms.filter(alarm => alarm.status === 'triggered' || alarm.status === 'snoozed');

        let html = '';

        // Show pending alarms first
        if (pendingAlarms.length > 0) {
            html += `
                <div class="alarm-section">
                    <h3><i class="fas fa-clock"></i> Active Alarms (${pendingAlarms.length})</h3>
                    <div class="alarms-container">
                        ${pendingAlarms
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map(alarm => this.createAlarmHTML(alarm))
                            .join('')}
                    </div>
                </div>
            `;
        }

        // Show triggered/snoozed alarms
        if (triggeredAlarms.length > 0) {
            html += `
                <div class="alarm-section">
                    <h3><i class="fas fa-bell"></i> Triggered Alarms (${triggeredAlarms.length})</h3>
                    <div class="alarms-container">
                        ${triggeredAlarms
                            .sort((a, b) => new Date(b.triggeredAt || b.createdAt) - new Date(a.triggeredAt || a.createdAt))
                            .map(alarm => this.createAlarmHTML(alarm))
                            .join('')}
                    </div>
                </div>
            `;
        }

        // Show alarm history
        if (completedAlarms.length > 0) {
            html += `
                <div class="alarm-section">
                    <h3><i class="fas fa-history"></i> Alarm History (${completedAlarms.length})</h3>
                    <div class="alarms-container">
                        ${completedAlarms
                            .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt))
                            .map(alarm => this.createAlarmHTML(alarm))
                            .join('')}
                    </div>
                </div>
            `;
        }

        alarmsList.innerHTML = html;

        // Add event listeners to new elements
        this.alarms.forEach(alarm => {
            const toggleBtn = document.querySelector(`[data-toggle="${alarm.id}"]`);
            const editBtn = document.querySelector(`[data-edit="${alarm.id}"]`);
            const deleteBtn = document.querySelector(`[data-delete="${alarm.id}"]`);
            
            if (toggleBtn) {
                toggleBtn.addEventListener('click', async () => await this.toggleAlarm(alarm.id));
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.openEditAlarmModal(alarm.id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => await this.deleteAlarm(alarm.id));
            }
        });
    }

    createAlarmHTML(alarm) {
        const time = new Date(`2000-01-01T${alarm.time}`);
        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Get status icon and class
        const statusInfo = this.getStatusInfo(alarm);
        
        // Format creation date
        const createdDate = new Date(alarm.createdAt);
        const createdString = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Format completion date if exists
        let completedString = '';
        if (alarm.completedAt) {
            const completedDate = new Date(alarm.completedAt);
            completedString = completedDate.toLocaleDateString() + ' ' + completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        return `
            <div class="alarm-item ${!alarm.enabled ? 'disabled' : ''} ${alarm.status}" data-id="${alarm.id}">
                <div class="alarm-info">
                    <div class="alarm-header">
                        <div class="alarm-time">${timeString}</div>
                        <div class="alarm-status ${statusInfo.class}">
                            <i class="${statusInfo.icon}"></i>
                            ${statusInfo.text}
                        </div>
                    </div>
                    <div class="alarm-label">${alarm.label}</div>
                    <div class="alarm-details">
                        <small>Created: ${createdString}</small>
                        ${completedString ? `<br><small>Completed: ${completedString}</small>` : ''}
                        ${alarm.snoozeCount > 0 ? `<br><small>Snoozed ${alarm.snoozeCount} times</small>` : ''}
                        ${alarm.customSound ? `<br><small><i class="fas fa-music"></i> Custom sound: ${alarm.customSoundName || 'Custom audio'}</small>` : ''}
                        <br><small><i class="fas fa-redo"></i> ${this.formatRepeatInfo(alarm)}</small>
                    </div>
                </div>
                <div class="alarm-controls">
                    ${alarm.status === 'pending' ? `
                        <div class="toggle-switch ${alarm.enabled ? 'active' : ''}" data-toggle="${alarm.id}"></div>
                    ` : ''}
                    <button class="edit-btn" data-edit="${alarm.id}" title="Edit Alarm">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-delete="${alarm.id}" title="Delete Alarm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getStatusInfo(alarm) {
        switch (alarm.status) {
            case 'pending':
                return {
                    icon: 'fas fa-clock',
                    text: 'Pending',
                    class: 'status-pending'
                };
            case 'triggered':
                return {
                    icon: 'fas fa-bell',
                    text: 'Triggered',
                    class: 'status-triggered'
                };
            case 'snoozed':
                return {
                    icon: 'fas fa-snooze',
                    text: `Snoozed (${alarm.snoozeCount}x)`,
                    class: 'status-snoozed'
                };
            case 'completed':
                return {
                    icon: 'fas fa-check-circle',
                    text: 'Completed',
                    class: 'status-completed'
                };
            default:
                return {
                    icon: 'fas fa-question',
                    text: 'Unknown',
                    class: 'status-unknown'
                };
        }
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const today = now.toDateString(); // For date comparison
        
        this.alarms.forEach(alarm => {
            if (!alarm.enabled || this.isPlaying) return;
            
            // Check if alarm should trigger based on repeat type
            let shouldTrigger = false;
            
            if (alarm.repeatType === 'once') {
                // One-time alarm - check if time matches and hasn't been triggered today
                shouldTrigger = alarm.time === currentTime && 
                               (!alarm.lastTriggeredDate || alarm.lastTriggeredDate !== today);
            } else if (alarm.repeatType === 'daily') {
                // Daily alarm - check if time matches and hasn't been triggered today
                shouldTrigger = alarm.time === currentTime && 
                               (!alarm.lastTriggeredDate || alarm.lastTriggeredDate !== today);
            } else if (alarm.repeatType === 'weekly') {
                // Weekly alarm - check if current day is selected and time matches
                shouldTrigger = alarm.repeatDays && 
                               alarm.repeatDays.includes(currentDay) && 
                               alarm.time === currentTime && 
                               (!alarm.lastTriggeredDate || alarm.lastTriggeredDate !== today);
            }
            
            if (shouldTrigger) {
                this.triggerAlarm(alarm);
            }
        });
    }

    triggerAlarm(alarm) {
        // Update alarm status
        alarm.status = 'triggered';
        alarm.triggeredAt = new Date().toISOString();
        alarm.lastTriggeredDate = new Date().toDateString(); // Track when this alarm was last triggered
        
        this.currentAlarm = alarm;
        this.isPlaying = true;
        
        // Show modal
        document.getElementById('alarmMessage').textContent = `${alarm.label} - ${alarm.time}`;
        document.getElementById('alarmModal').classList.add('show');
        
        // Play sound
        this.playAlarmSound();
        
        // Request notification permission and show notification
        this.showBrowserNotification(alarm);
        
        // Save alarm status
        this.saveAlarms();
        this.renderAlarms();
    }

    playAlarmSound() {
        // Check if current alarm has a custom sound
        if (this.currentAlarm && this.currentAlarm.customSound) {
            this.playCustomSound(this.currentAlarm.customSound);
        } else {
            try {
                // Method 1: Try using Audio API with a simple beep
                this.playSimpleBeep();
            } catch (error) {
                console.error('Error playing alarm sound:', error);
                // Method 2: Fallback to Web Audio API
                this.playWebAudioBeep();
            }
        }
    }

    playCustomSound(audioUrl) {
        try {
            const audio = new Audio(audioUrl);
            audio.volume = 0.8;
            audio.loop = true; // Loop the custom sound
            
            // Store reference for stopping
            this.currentCustomAudio = audio;
            
            // Play the custom sound
            audio.play().then(() => {
                console.log('Custom alarm sound playing');
            }).catch(error => {
                console.error('Error playing custom sound:', error);
                // Fallback to default beep
                this.playSimpleBeep();
            });
            
        } catch (error) {
            console.error('Error creating custom audio:', error);
            // Fallback to default beep
            this.playSimpleBeep();
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
            const beepData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
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

    testCustomSound() {
        if (!this.selectedAudioFile) {
            this.showNotification('Please select a sound file first', 'error');
            return;
        }
        
        this.showNotification('Testing custom sound...', 'info');
        
        try {
            const audioUrl = URL.createObjectURL(this.selectedAudioFile);
            const audio = new Audio(audioUrl);
            audio.volume = 0.8;
            
            // Play the custom sound
            audio.play().then(() => {
                console.log('Custom sound test playing');
                
                // Stop after 5 seconds
                setTimeout(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    URL.revokeObjectURL(audioUrl);
                    this.showNotification('Custom sound test completed!', 'success');
                }, 5000);
                
            }).catch(error => {
                console.error('Error playing custom sound test:', error);
                URL.revokeObjectURL(audioUrl);
                this.showNotification('Error playing custom sound', 'error');
            });
            
        } catch (error) {
            console.error('Error creating custom audio test:', error);
            this.showNotification('Error testing custom sound', 'error');
        }
    }

    stopAlarm() {
        console.log('Stopping alarm immediately...');
        
        // Mark current alarm as completed or reset for repeating alarms
        if (this.currentAlarm) {
            if (this.currentAlarm.repeatType === 'once') {
                // One-time alarm - mark as completed
                this.currentAlarm.status = 'completed';
                this.currentAlarm.completedAt = new Date().toISOString();
            } else {
                // Repeating alarm - reset to pending for next occurrence
                this.currentAlarm.status = 'pending';
                this.currentAlarm.triggeredAt = null;
                // Keep lastTriggeredDate to prevent immediate re-triggering
            }
            this.saveAlarms();
            this.renderAlarms();
        }
        
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
        
        // Stop custom audio if playing
        if (this.currentCustomAudio) {
            try {
                this.currentCustomAudio.pause();
                this.currentCustomAudio.currentTime = 0;
                this.currentCustomAudio = null;
            } catch (error) {
                console.error('Error stopping custom audio:', error);
            }
        }
        
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
        
        // Update current alarm snooze info
        this.currentAlarm.status = 'snoozed';
        this.currentAlarm.snoozeCount = (this.currentAlarm.snoozeCount || 0) + 1;
        this.currentAlarm.lastSnoozeAt = new Date().toISOString();
        
        // Stop current alarm
        this.stopAlarm();
        
        // Create snooze alarm (5 minutes later)
        const now = new Date();
        const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
        const snoozeTimeString = snoozeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const snoozeAlarm = {
            id: Date.now().toString(),
            time: snoozeTimeString,
            label: `${this.currentAlarm.label} (Snoozed)`,
            enabled: true,
            status: 'pending',
            createdAt: new Date().toISOString(),
            triggeredAt: null,
            completedAt: null,
            snoozeCount: 0,
            lastSnoozeAt: null,
            originalAlarmId: this.currentAlarm.id,
            customSound: this.currentAlarm.customSound,
            customSoundName: this.currentAlarm.customSoundName,
            repeatType: 'once', // Snooze alarms are always one-time
            repeatDays: [],
            lastTriggeredDate: null
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

    handleAudioFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/mp4'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please select a valid audio file (MP3, WAV, or OGG)', 'error');
            this.clearFileSelection();
            return;
        }
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 10MB', 'error');
            this.clearFileSelection();
            return;
        }
        
        // Store the file and display file name
        this.selectedAudioFile = file;
        const fileNameDisplay = document.getElementById('selectedFileName');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
            fileNameDisplay.style.display = 'inline';
        }
        
        this.showNotification(`Sound file selected: ${file.name}`, 'success');
    }
    
    clearFileSelection() {
        this.selectedAudioFile = null;
        const fileInput = document.getElementById('alarmSoundFile');
        const fileNameDisplay = document.getElementById('selectedFileName');
        
        if (fileInput) fileInput.value = '';
        if (fileNameDisplay) {
            fileNameDisplay.textContent = '';
            fileNameDisplay.style.display = 'none';
        }
    }

    // Profile Picture Methods
    openProfileModal() {
        // Check if user is authenticated before opening modal
        if (!this.isUserAuthenticated()) {
            this.showNotification('Please log in to manage your profile picture', 'error');
            return;
        }
        
        const modal = document.getElementById('profileModal');
        modal.classList.add('show');
        this.loadCurrentProfilePicture();
    }

    closeProfileModal() {
        const modal = document.getElementById('profileModal');
        modal.classList.remove('show');
        this.resetProfileSelection();
    }

    loadCurrentProfilePicture() {
        if (this.currentProfileImage) {
            const preview = document.getElementById('profilePreview');
            const profilePic = document.getElementById('profilePicture');
            
            // Update preview
            preview.innerHTML = `<img src="${this.currentProfileImage}" alt="Profile Picture">`;
            
            // Update header profile picture
            profilePic.innerHTML = `<img src="${this.currentProfileImage}" alt="Profile Picture">`;
        }
    }

    openCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showNotification('Camera access not supported in this browser', 'error');
            return;
        }

        // Create video element for camera
        const video = document.createElement('video');
        video.style.width = '100%';
        video.style.maxWidth = '400px';
        video.style.borderRadius = '8px';
        video.autoplay = true;
        video.muted = true;

        // Get camera stream
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                video.srcObject = stream;
                
                // Replace preview with video
                const preview = document.getElementById('profilePreview');
                preview.innerHTML = '';
                preview.appendChild(video);
                
                // Show capture button
                this.showCaptureButton(stream);
            })
            .catch(error => {
                console.error('Camera access error:', error);
                this.showNotification('Camera access denied or not available', 'error');
            });
    }

    showCaptureButton(stream) {
        const actions = document.getElementById('profileActions');
        actions.innerHTML = `
            <button class="btn btn-success" onclick="alarmSystem.capturePhoto()">
                <i class="fas fa-camera"></i> Capture Photo
            </button>
            <button class="btn btn-secondary" onclick="alarmSystem.cancelCamera()">
                <i class="fas fa-times"></i> Cancel
            </button>
        `;
        actions.style.display = 'flex';
        
        // Store stream for later use
        this.currentStream = stream;
    }

    capturePhoto() {
        const video = document.querySelector('#profilePreview video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob(blob => {
            this.selectedProfileImage = blob;
            this.displaySelectedImage(URL.createObjectURL(blob));
            this.stopCamera();
        }, 'image/jpeg', 0.8);
    }

    cancelCamera() {
        this.stopCamera();
        this.resetProfileSelection();
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    openGallery() {
        // Create file input for gallery access
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleProfileImageSelect(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    handleProfileImageSelect(file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please select a valid image file (JPG, PNG, GIF)', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 5MB', 'error');
            return;
        }
        
        this.selectedProfileImage = file;
        const imageUrl = URL.createObjectURL(file);
        this.displaySelectedImage(imageUrl);
    }

    displaySelectedImage(imageUrl) {
        const preview = document.getElementById('profilePreview');
        preview.innerHTML = `<img src="${imageUrl}" alt="Selected Profile Picture">`;
        
        // Show action buttons
        const actions = document.getElementById('profileActions');
        actions.innerHTML = `
            <button class="btn btn-success" onclick="alarmSystem.saveProfilePicture()">
                <i class="fas fa-save"></i> Save
            </button>
            <button class="btn btn-warning" onclick="alarmSystem.editProfilePicture()">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-secondary" onclick="alarmSystem.cancelProfileEdit()">
                <i class="fas fa-times"></i> Cancel
            </button>
        `;
        actions.style.display = 'flex';
    }

    saveProfilePicture() {
        if (!this.selectedProfileImage) {
            this.showNotification('No image selected to save', 'error');
            return;
        }

        // Check if user is authenticated
        if (!this.isUserAuthenticated()) {
            this.showNotification('User session not found. Please log in again.', 'error');
            return;
        }

        try {
            // Create object URL for the selected image
            const imageUrl = URL.createObjectURL(this.selectedProfileImage);
            this.currentProfileImage = imageUrl;
            
            // Update profile picture in header
            const profilePic = document.getElementById('profilePicture');
            if (profilePic) {
                profilePic.innerHTML = `<img src="${imageUrl}" alt="Profile Picture">`;
            }
            
            // Save to localStorage with user ID
            const storageKey = `profile_${this.currentUser.id}`;
            localStorage.setItem(storageKey, imageUrl);
            
            // Also save the image data for persistence
            if (this.selectedProfileImage instanceof Blob) {
                // Convert blob to base64 for better persistence
                const reader = new FileReader();
                reader.onload = (e) => {
                    localStorage.setItem(`${storageKey}_data`, e.target.result);
                };
                reader.readAsDataURL(this.selectedProfileImage);
            }
            
            this.showNotification('Profile picture saved successfully!', 'success');
            this.closeProfileModal();
            
        } catch (error) {
            console.error('Error saving profile picture:', error);
            this.showNotification('Error saving profile picture', 'error');
        }
    }

    editProfilePicture() {
        // For now, just reopen the modal to select a new image
        // In a more advanced implementation, you could add image editing features
        this.showNotification('Select a new image to replace current profile picture', 'info');
        this.resetProfileSelection();
    }

    deleteProfilePicture() {
        if (confirm('Are you sure you want to delete your profile picture?')) {
            // Check if user is authenticated
            if (!this.isUserAuthenticated()) {
                this.showNotification('User session not found. Please log in again.', 'error');
                return;
            }
            
            // Remove current profile image
            this.currentProfileImage = null;
            
            // Reset profile picture in header
            const profilePic = document.getElementById('profilePicture');
            if (profilePic) {
                profilePic.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            // Remove from localStorage (both object URL and base64 data)
            if (this.currentUser && this.currentUser.id) {
                const storageKey = `profile_${this.currentUser.id}`;
                localStorage.removeItem(storageKey);
                localStorage.removeItem(`${storageKey}_data`);
            }
            
            // Reset preview
            const preview = document.getElementById('profilePreview');
            if (preview) {
                preview.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            this.showNotification('Profile picture deleted!', 'success');
            this.closeProfileModal();
        }
    }

    cancelProfileEdit() {
        this.resetProfileSelection();
        this.loadCurrentProfilePicture();
    }

    resetProfileSelection() {
        this.selectedProfileImage = null;
        this.stopCamera();
        
        const actions = document.getElementById('profileActions');
        actions.style.display = 'none';
    }

    loadProfilePicture() {
        if (this.currentUser && this.currentUser.id) {
            const storageKey = `profile_${this.currentUser.id}`;
            let savedImage = localStorage.getItem(storageKey);
            
            // If object URL is not available, try base64 data
            if (!savedImage) {
                savedImage = localStorage.getItem(`${storageKey}_data`);
            }
            
            if (savedImage) {
                this.currentProfileImage = savedImage;
                const profilePic = document.getElementById('profilePicture');
                if (profilePic) {
                    profilePic.innerHTML = `<img src="${savedImage}" alt="Profile Picture">`;
                }
            } else {
                // Reset to default if no saved image
                const profilePic = document.getElementById('profilePicture');
                if (profilePic) {
                    profilePic.innerHTML = '<i class="fas fa-user"></i>';
                }
            }
        }
    }

    refreshProfilePicture() {
        // This method can be called to refresh the profile picture display
        // Useful after login or when user data changes
        setTimeout(() => {
            this.loadProfilePicture();
        }, 100); // Small delay to ensure DOM is ready
    }

    refreshUserSession() {
        // Refresh the current user session from storage
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                          JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!this.currentUser) {
            console.warn('No user session found');
            return false;
        }
        
        console.log('User session refreshed:', this.currentUser);
        return true;
    }

    isUserAuthenticated() {
        // Check if user is properly authenticated
        if (!this.currentUser || !this.currentUser.id) {
            return this.refreshUserSession();
        }
        return true;
    }

    debugUserSession() {
        // Debug method to check user session status
        console.log('=== User Session Debug ===');
        console.log('Current User:', this.currentUser);
        console.log('LocalStorage currentUser:', localStorage.getItem('currentUser'));
        console.log('SessionStorage currentUser:', sessionStorage.getItem('currentUser'));
        console.log('Is Authenticated:', this.isUserAuthenticated());
        console.log('========================');
    }

    // Edit Alarm Methods
    openEditAlarmModal(alarmId) {
        const alarm = this.alarms.find(a => a.id === alarmId);
        if (!alarm) {
            this.showNotification('Alarm not found', 'error');
            return;
        }

        // Store the alarm being edited
        this.editingAlarm = alarm;
        
        // Populate the edit form
        this.populateEditForm(alarm);
        
        // Show the modal
        const modal = document.getElementById('editAlarmModal');
        modal.classList.add('show');
    }

    populateEditForm(alarm) {
        // Populate form with alarm data
        document.getElementById('editAlarmTime').value = alarm.time;
        document.getElementById('editAlarmLabel').value = alarm.label;
        
        // Set repeat options
        const editRepeatTypeRadios = document.querySelectorAll('input[name="editRepeatType"]');
        editRepeatTypeRadios.forEach(radio => {
            radio.checked = radio.value === (alarm.repeatType || 'once');
        });
        
        // Show/hide weekly days group based on repeat type
        const editWeeklyDaysGroup = document.getElementById('editWeeklyDaysGroup');
        if (alarm.repeatType === 'weekly') {
            editWeeklyDaysGroup.style.display = 'block';
            // Set selected days
            const editDayCheckboxes = document.querySelectorAll('#editWeeklyDaysGroup input[type="checkbox"]');
            editDayCheckboxes.forEach(cb => {
                cb.checked = alarm.repeatDays && alarm.repeatDays.includes(parseInt(cb.value));
            });
        } else {
            editWeeklyDaysGroup.style.display = 'none';
        }
        
        // Clear previous audio file selection
        this.selectedEditAudioFile = null;
        document.getElementById('editSelectedFileName').textContent = '';
        document.getElementById('editSelectedFileName').style.display = 'none';
        
        // Show current custom sound if exists
        if (alarm.customSoundName) {
            document.getElementById('editSelectedFileName').textContent = `Current: ${alarm.customSoundName}`;
            document.getElementById('editSelectedFileName').style.display = 'inline';
        }
    }

    closeEditAlarmModal() {
        const modal = document.getElementById('editAlarmModal');
        modal.classList.remove('show');
        
        // Reset form
        document.getElementById('editAlarmTime').value = '';
        document.getElementById('editAlarmLabel').value = '';
        this.clearEditFileSelection();
        this.resetEditRepeatOptions();
        
        // Clear editing alarm
        this.editingAlarm = null;
    }

    async saveEditAlarm() {
        if (!this.editingAlarm) {
            this.showNotification('No alarm selected for editing', 'error');
            return;
        }

        const timeInput = document.getElementById('editAlarmTime');
        const labelInput = document.getElementById('editAlarmLabel');
        
        const time = timeInput.value;
        const label = labelInput.value.trim() || 'Alarm';
        const repeatType = this.getEditRepeatType();
        const repeatDays = repeatType === 'weekly' ? this.getEditSelectedDays() : [];
        
        if (!time) {
            this.showNotification('Please select a time for the alarm.', 'error');
            return;
        }

        // Validate weekly selection
        if (repeatType === 'weekly' && repeatDays.length === 0) {
            alert('Please select at least one day for weekly repeat.');
            return;
        }

        try {
            // Update alarm properties
            this.editingAlarm.time = time;
            this.editingAlarm.label = label;
            this.editingAlarm.repeatType = repeatType;
            this.editingAlarm.repeatDays = repeatDays;
            
            // Update custom sound if new one selected
            if (this.selectedEditAudioFile) {
                const audioUrl = URL.createObjectURL(this.selectedEditAudioFile);
                this.editingAlarm.customSound = audioUrl;
                this.editingAlarm.customSoundName = this.selectedEditAudioFile.name;
            }
            
            // Save to backend and localStorage
            await this.saveAlarms();
            
            // Re-render alarms
            this.renderAlarms();
            
            // Close modal
            this.closeEditAlarmModal();
            
            this.showNotification('Alarm updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating alarm:', error);
            this.showNotification('Error updating alarm', 'error');
        }
    }

    handleEditAudioFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/mp4'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please select a valid audio file (MP3, WAV, or OGG)', 'error');
            this.clearEditFileSelection();
            return;
        }
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 10MB', 'error');
            this.clearEditFileSelection();
            return;
        }
        
        // Store the file and display file name
        this.selectedEditAudioFile = file;
        const fileNameDisplay = document.getElementById('editSelectedFileName');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
            fileNameDisplay.style.display = 'inline';
        }
        
        this.showNotification(`Sound file selected: ${file.name}`, 'success');
    }

    clearEditFileSelection() {
        this.selectedEditAudioFile = null;
        const fileInput = document.getElementById('editAlarmSoundFile');
        const fileNameDisplay = document.getElementById('editSelectedFileName');
        
        if (fileInput) fileInput.value = '';
        if (fileNameDisplay) {
            fileNameDisplay.textContent = '';
            fileNameDisplay.style.display = 'none';
        }
    }

    testEditCustomSound() {
        if (!this.selectedEditAudioFile) {
            this.showNotification('Please select a sound file first', 'error');
            return;
        }
        
        this.showNotification('Testing custom sound...', 'info');
        
        try {
            const audioUrl = URL.createObjectURL(this.selectedEditAudioFile);
            const audio = new Audio(audioUrl);
            audio.volume = 0.8;
            
            // Play the custom sound
            audio.play().then(() => {
                console.log('Custom sound test playing');
                
                // Stop after 5 seconds
                setTimeout(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    URL.revokeObjectURL(audioUrl);
                    this.showNotification('Custom sound test completed!', 'success');
                }, 5000);
                
            }).catch(error => {
                console.error('Error playing custom sound test:', error);
                URL.revokeObjectURL(audioUrl);
                this.showNotification('Error playing custom sound', 'error');
            });
            
        } catch (error) {
            console.error('Error creating custom audio test:', error);
            this.showNotification('Error testing custom sound', 'error');
        }
    }

    // Repeat alarm options
    setupRepeatOptions() {
        // Main form repeat options
        const repeatTypeRadios = document.querySelectorAll('input[name="repeatType"]');
        const weeklyDaysGroup = document.getElementById('weeklyDaysGroup');
        
        repeatTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'weekly') {
                    weeklyDaysGroup.style.display = 'block';
                } else {
                    weeklyDaysGroup.style.display = 'none';
                    // Clear all day selections when not weekly
                    document.querySelectorAll('#weeklyDaysGroup input[type="checkbox"]').forEach(cb => {
                        cb.checked = false;
                    });
                }
            });
        });

        // Edit form repeat options
        const editRepeatTypeRadios = document.querySelectorAll('input[name="editRepeatType"]');
        const editWeeklyDaysGroup = document.getElementById('editWeeklyDaysGroup');
        
        editRepeatTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'weekly') {
                    editWeeklyDaysGroup.style.display = 'block';
                } else {
                    editWeeklyDaysGroup.style.display = 'none';
                    // Clear all day selections when not weekly
                    document.querySelectorAll('#editWeeklyDaysGroup input[type="checkbox"]').forEach(cb => {
                        cb.checked = false;
                    });
                }
            });
        });
    }

    getSelectedDays() {
        const selectedDays = [];
        document.querySelectorAll('#weeklyDaysGroup input[type="checkbox"]:checked').forEach(cb => {
            selectedDays.push(parseInt(cb.value));
        });
        return selectedDays;
    }

    getEditSelectedDays() {
        const selectedDays = [];
        document.querySelectorAll('#editWeeklyDaysGroup input[type="checkbox"]:checked').forEach(cb => {
            selectedDays.push(parseInt(cb.value));
        });
        return selectedDays;
    }

    getRepeatType() {
        const selectedRadio = document.querySelector('input[name="repeatType"]:checked');
        return selectedRadio ? selectedRadio.value : 'once';
    }

    getEditRepeatType() {
        const selectedRadio = document.querySelector('input[name="editRepeatType"]:checked');
        return selectedRadio ? selectedRadio.value : 'once';
    }

    formatRepeatInfo(alarm) {
        if (!alarm.repeatType || alarm.repeatType === 'once') {
            return 'Once';
        } else if (alarm.repeatType === 'daily') {
            return 'Daily';
        } else if (alarm.repeatType === 'weekly' && alarm.repeatDays) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const selectedDays = alarm.repeatDays.map(day => dayNames[day]).join(', ');
            return `Weekly (${selectedDays})`;
        }
        return 'Once';
    }

    resetRepeatOptions() {
        // Reset main form repeat options
        document.querySelector('input[name="repeatType"][value="once"]').checked = true;
        document.getElementById('weeklyDaysGroup').style.display = 'none';
        document.querySelectorAll('#weeklyDaysGroup input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }

    resetEditRepeatOptions() {
        // Reset edit form repeat options
        document.querySelector('input[name="editRepeatType"][value="once"]').checked = true;
        document.getElementById('editWeeklyDaysGroup').style.display = 'none';
        document.querySelectorAll('#editWeeklyDaysGroup input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
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
    window.alarmSystem = new AlarmSystem();
});

// Global functions for HTML onclick events
function openProfileModal() {
    if (window.alarmSystem) {
        window.alarmSystem.openProfileModal();
    }
}

function closeProfileModal() {
    if (window.alarmSystem) {
        window.alarmSystem.closeProfileModal();
    }
}

function openCamera() {
    if (window.alarmSystem) {
        window.alarmSystem.openCamera();
    }
}

function openGallery() {
    if (window.alarmSystem) {
        window.alarmSystem.openGallery();
    }
}

function saveProfilePicture() {
    if (window.alarmSystem) {
        window.alarmSystem.saveProfilePicture();
    }
}

function editProfilePicture() {
    if (window.alarmSystem) {
        window.alarmSystem.editProfilePicture();
    }
}

function deleteProfilePicture() {
    if (window.alarmSystem) {
        window.alarmSystem.deleteProfilePicture();
    }
}

function cancelProfileEdit() {
    if (window.alarmSystem) {
        window.alarmSystem.cancelProfileEdit();
    }
}

function cancelCamera() {
    if (window.alarmSystem) {
        window.alarmSystem.cancelCamera();
    }
}

function capturePhoto() {
    if (window.alarmSystem) {
        window.alarmSystem.capturePhoto();
    }
}

// Edit Alarm Global Functions
function closeEditAlarmModal() {
    if (window.alarmSystem) {
        window.alarmSystem.closeEditAlarmModal();
    }
}

function saveEditAlarm() {
    if (window.alarmSystem) {
        window.alarmSystem.saveEditAlarm();
    }
} 