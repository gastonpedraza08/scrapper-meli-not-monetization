function getCondition() {
	let conditionElement = document.querySelector('.andes-badge.andes-badge--pill.andes-badge--generic .andes-badge__content');
	let condition;

	if (conditionElement) {
		condition = conditionElement.innerText;
	} else {
		condition = document.querySelector('.ui-pdp-header__subtitle .ui-pdp-subtitle').innerText.match(/\w+/gi)[0];
	}
	return condition;
}


module.exports = {
	getCondition,
}