test:
	casperjs test --includes=tests/_inc.js --pre=tests/_pre.js tests/suites
test_verbose:
	casperjs test --includes=tests/_inc.js --pre=tests/_pre.js --direct --log-level=debug tests/suites
i18n:
	node reqs/i18n/bin/i18n.js --dir_path=src/js/ --locale_dir_path=src/locale/ --locale_codes=fr,es,nl,de,pt,it