# Digital Alarm System

A modern, responsive web-based alarm system that allows users to set multiple alarms, delete them, and toggle them on/off.

## Features

- ⏰ **Set Multiple Alarms**: Add as many alarms as you need with custom labels
- 🔄 **Toggle On/Off**: Enable or disable alarms without deleting them
- 🗑️ **Delete Alarms**: Remove alarms you no longer need
- 🔊 **Sound Notifications**: Audible alarm sounds when time is reached
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 💾 **Local Storage**: Alarms are saved in your browser and persist between sessions
- ⏰ **Real-time Clock**: Live clock display showing current time
- 🔔 **Browser Notifications**: Desktop notifications (with permission)
- 😴 **Snooze Function**: Snooze alarms for 5 minutes

## How to Use

1. **Open the Application**
   - Double-click on `index.html` to open in your web browser
   - Or drag and drop `index.html` into your browser window

2. **Add an Alarm**
   - Select a time using the time picker
   - Optionally add a label (e.g., "Wake up", "Work", "Meeting")
   - Click "Add Alarm"

3. **Manage Alarms**
   - **Toggle On/Off**: Click the toggle switch next to an alarm
   - **Delete**: Click the red trash icon to remove an alarm
   - **View**: All alarms are displayed in chronological order

4. **When Alarm Goes Off**
   - A modal will appear with the alarm message
   - Sound will play automatically
   - Choose to:
     - **Snooze**: Delay the alarm for 5 minutes
     - **Stop**: Turn off the alarm completely

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage
- **Audio**: Web Audio API for alarm sounds
- **Icons**: Font Awesome
- **No external dependencies** - works offline!

## File Structure

```
alarm-system/
├── index.html      # Main HTML file
├── styles.css      # CSS styles and animations
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Troubleshooting

**Alarm sound not working?**
- Make sure your browser supports Web Audio API
- Check that your system volume is not muted
- Try refreshing the page

**Notifications not showing?**
- Allow notifications when prompted by the browser
- Check your browser's notification settings

**Alarms not saving?**
- Ensure localStorage is enabled in your browser
- Try using a different browser

## Future Enhancements

- Custom alarm sounds
- Recurring alarms (daily, weekly, etc.)
- Multiple snooze intervals
- Alarm categories/tags
- Export/import alarm settings
- Dark mode theme

## License

This project is open source and available under the MIT License. 