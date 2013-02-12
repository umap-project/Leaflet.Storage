test:
	casperjs test --includes=tests/_inc.js --pre=tests/_pre.js tests/suites
test_verbose:
	casperjs test --includes=tests/_inc.js --pre=tests/_pre.js --direct --log-level=debug tests/suites
i18n:
	node bin/i18n.js