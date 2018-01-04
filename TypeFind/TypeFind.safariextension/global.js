var sa = safari.application;
var se = safari.extension;

const defaults = {
	trigger : {
		key      : '/',
		altKey   : false,
		ctrlKey  : false,
		metaKey  : false,
		shiftKey : false
	},
	triggerKey : '/',
	useTrigger : false
};

function handleMessage(event) {
	switch (event.name) {
		case 'passSettings': {
			event.target.page.dispatchMessage('receiveSettings', JSON.parse(JSON.stringify(se.settings)));
			break;
		}
	}
}
function handleSettingChange(event) {
	if (event.newValue != event.oldValue) {
		console.log(event);
		switch (event.key) {
			case 'trigger':
			case 'useTrigger':
				passSettingsToAllPages([event.key]);
			break;
			case 'triggerKey':
				if (event.newValue.length == 0) {
					se.settings.triggerKey = defaults.triggerKey;
				} else
				if (event.newValue.length > 1) {
					se.settings.triggerKey = event.newValue.substring(0, 1);
				} else {
					var trigger = se.settings.trigger;
					trigger.key = se.settings.triggerKey;
					se.settings.trigger = trigger;
				}
			break;
		}
	}
}
function initializeSettings() {
	var lastVersion = se.settings.lastVersion;
	for (var key in defaults) {
		if (se.settings[key] === undefined) {
			se.settings[key] = defaults[key];
		}
	}
	if (lastVersion < 7) {
		var trigger = se.settings.trigger;
		trigger.key = defaults.trigger.key;
		se.settings.trigger = trigger;
	}
	se.settings.lastVersion = 7;
}
function passSettingsToAllPages(keys) {
	var message = {};
	var thisWindow = {};
	var thisTab = {};
	var copyKey = function (key) {
		message[key] = se.settings[key];
		console.log('Will pass settings.' + key + ' with value:', message[key]);
	}
	keys.forEach(copyKey);
	for (var i = 0; i < sa.browserWindows.length; i++) {
		thisWindow = sa.browserWindows[i];
		for (var j = 0; j < thisWindow.tabs.length; j++) {
			thisTab = thisWindow.tabs[j];
			if (thisTab.page !== undefined) {
				console.log('Passing settings to page at ' + thisTab.url);
				thisTab.page.dispatchMessage('receiveSettings', message);
			}
		}
	}
}

initializeSettings();
sa.addEventListener('message', handleMessage, false);
se.settings.addEventListener('change', handleSettingChange, false);
