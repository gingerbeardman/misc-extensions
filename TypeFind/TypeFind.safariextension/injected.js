const forbiddenTargets = ['INPUT','BUTTON','SELECT','TEXTAREA'];
var keyString = '';
var matchingNodes = [];
var matchingNodeIndex = 0;
var mySpan = null;
var triggerPulled = null;
var listeningForKeyOnHighlight = false;

function cancelEverything() {
	keyString = '';
	unhighlightPreviousMatch();
	if (triggerPulled) {
		document.removeEventListener('keypress', findTyped, false);
		document.addEventListener('keypress', listenForTrigger, false);
		triggerPulled = false;
	}
}
function findMatchingNodes(string, element, reentrant) {
	if (!reentrant) {
		matchingNodes.length = 0;
		unhighlightPreviousMatch();
	}
	if (element.offsetWidth == 0)
		return;
	for (var child, i = 0; i < element.childNodes.length; i++) {
		child = element.childNodes[i];
		if (child.nodeType == 3) {
			if (child.nodeValue.toLowerCase().indexOf(string) > -1) {
				var elemStyle = window.getComputedStyle(element);
				if (elemStyle && !(elemStyle.visibility === 'hidden' || elemStyle.display === 'none')) {
					matchingNodes.push(child);
				}
			}
		}
		else if (child.nodeType == 1) {
			findMatchingNodes(string, child, true);
		}
	}
}
function findTyped(e) {
	var elementIsForbidden = (forbiddenTargets.indexOf(e.target.nodeName) > -1);
	if (elementIsForbidden || e.target.isContentEditable)
		return;
	if (e.ctrlKey || e.altKey || e.metaKey)
		return;
	if (listeningForKeyOnHighlight)
		document.removeEventListener('keydown', handleKeypressOnHighlight, false);
	matchingNodeIndex = 0;
	if (e.which == 32) {
		if (keyString.length) {
			e.preventDefault();
			keyString += ' ';
		}
	} else {
		keyString += String.fromCharCode(e.which).toLowerCase();
	}
	if (!keyString.length)
		return;
	findMatchingNodes(keyString, document.body);
	if (matchingNodes.length) {
		highlightMatch(keyString);
	} else {
		keyString = '';
	}
}
function handleMessage(e) {
	switch (e.name) {
		case 'receiveSettings':
			for (var key in e.message) {
				settings[key] = e.message[key];
			}
			if (e.message.useTrigger != undefined) {
				if (settings.useTrigger) {
					triggerPulled = false;
					document.removeEventListener('keypress', findTyped, false);
					document.addEventListener('keypress', listenForTrigger, false);
				} else {
					triggerPulled = null;
					document.removeEventListener('keypress', listenForTrigger, false);
					document.removeEventListener('keypress', findTyped, false);
					document.addEventListener('keypress', findTyped, false);
				}
			}
		break;
	}
}
function highlightMatch(string) {
	var mNode = matchingNodes[matchingNodeIndex];
	var offset = mNode.nodeValue.toLowerCase().indexOf(string);
	var sNode = mNode.splitText(offset);
	sNode.splitText(string.length);
	mySpan = document.createElement('span');
	mySpan.id = 'canisbos_found_text';
	mySpan.textContent = sNode.nodeValue;
	mySpan.style.boxShadow = '0px 2px 5px rgba(0,0,0,0.8)';
	mySpan.style.borderRadius = '3px';
	mySpan.style.padding = '0';
	mySpan.style.background = '-webkit-gradient(linear, 0% 0%, 0% 100%, from(#FFEE88), color-stop(0.95, gold), to(yellow))';
	mySpan.style.color = 'black';
	mySpan.style.textDecoration = 'none';
	mySpan.style.textShadow = 'rgba(255,255,255,0.8) 0px 1px 1px';
	sNode.parentNode.replaceChild(mySpan, sNode);
	mySpan.scrollIntoViewIfNeeded();
	listeningForKeyOnHighlight = true;
	document.addEventListener('keydown', handleKeypressOnHighlight, false);
}
function handleKeypressOnHighlight(e) {
	if (e.ctrlKey || e.altKey || e.metaKey)
		return;
	if (e.which == 9) {
		e.preventDefault();
		e.stopPropagation();
		matchingNodeIndex = (matchingNodeIndex - (e.shiftKey || -1)) % matchingNodes.length;
		if (matchingNodeIndex < 0)
			matchingNodeIndex = matchingNodes.length - 1;
		findMatchingNodes(keyString, document.body);
		if (matchingNodes.length) {
			highlightMatch(keyString);
		} else {
			keyString = '';
		}
	}
	else if (e.which == 13) {
		var node = mySpan;
		while (!node.href && node !== document.body) {
			node = node.parentNode;
		}
		if (node.href) {
			node.click();
		}
	}
}
function listenForTrigger(e) {
	triggerPulled = true;
	for (var key in settings.trigger) {
		if (e[key] != settings.trigger[key]) {
			triggerPulled = false;
			break;
		}
	}
	if (triggerPulled) {
		document.removeEventListener('keypress', listenForTrigger, false);
		document.addEventListener('keypress', findTyped, false);
	}
}
function unhighlightPreviousMatch() {
	if (mySpan) {
		var pn = mySpan.parentNode;
		pn.replaceChild(document.createTextNode(mySpan.textContent), mySpan);
		pn.normalize();
		mySpan = null;
	}
}

if (window == window.top) {
	var settings = {};
	safari.self.addEventListener('message', handleMessage, false);
	safari.self.tab.dispatchMessage('passSettings');
	document.addEventListener('keyup', function (e) {
		if (e.which == 27) {
			cancelEverything();
		}
	}, false);
	document.addEventListener('click', cancelEverything, false);
}
