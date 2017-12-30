function gatherTextNodes(startNode) {
	for (var child, tc, i = 0; i < startNode.childNodes.length; i++) {
		child = startNode.childNodes[i];
		if (child.nodeType == 3) {
			tc = child.textContent;
			if (/\S/.test(tc)) {
				tnArray.push(child);
			}
		} else
		if (child.nodeType == 1) {
			gatherTextNodes(child);
		}
	}
}
