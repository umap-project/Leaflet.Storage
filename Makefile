.PHONY: test
install:
	npm install
vendors:
	grunt
testfx:
	firefox test/index.html
test: node_modules
	@./node_modules/mocha-phantomjs/bin/mocha-phantomjs --view 1024x768 test/index.html
i18n:
	node node_modules/leaflet-i18n/bin/i18n.js --dir_path=src/js/ --dir_path=reqs/measurable/ --locale_dir_path=src/locale/ --locale_codes=en --mode=json --clean --default_values
tx_push:
	tx push -s
tx_pull:
	tx pull
