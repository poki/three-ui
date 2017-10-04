var isFirefox = function() {
	return /firefox/i.test(navigator.userAgent);
}();

module.exports = {
	isFirefox: isFirefox,
};