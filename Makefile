.PHONY: test
test:
	firefox test/index.html
i18n:
	node reqs/i18n/bin/i18n.js --dir_path=src/js/ --locale_dir_path=src/locale/ --locale_codes=fr,es,nl,de,pt,it,fi,en --mode=json