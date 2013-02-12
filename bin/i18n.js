var UglifyJS = require("uglify-js");
var fs = require("fs");
var path = require("path");
var dir_path = 'src/js',
    locale_dir = 'src/locale',
    locale_codes = ['fr', 'de', 'it'],
    locales = {},
    files = fs.readdirSync(dir_path),
    ast = null,
    code = "",
    strings = [];
files.forEach(function(file){
    code += fs.readFileSync(path.join(dir_path, file), "utf8");
});
ast = UglifyJS.parse(code);

ast.walk(new UglifyJS.TreeWalker(function (node) {
    if (node instanceof UglifyJS.AST_Call && node.expression.property == "_") {
        if (typeof node.args[0].value !== "undefined") {
            strings.push(node.args[0].value);
        }
    }
}));
strings.sort();

L = {
    S: {
        registerLocale: function (name, strings) {
            locales[name] = strings;
        }
    }
};
locale_codes.forEach(function (locale_code) {
    locales[locale_code] = {};
    var locale_path = path.join(locale_dir, locale_code + ".js");
    if (fs.existsSync(locale_path)) {
        // Will call our monkeypatched registerLocale
        eval(fs.readFileSync(locale_path, "utf8"));
    }
    var translations = locales[locale_code],
        missing = {},
        locale_raw_content = "var " + locale_code + " = ";
    strings.forEach(function (str) {
        if (!translations[str]) {
            translations[str] = "";
            missing[str] = "";
        }
    });
    locale_raw_content += JSON.stringify(translations, null, 4);
    locale_raw_content += ";\n\n";
    locale_raw_content += 'L.S.registerLocale("' + locale_code + '", '+ locale_code + ');';
    process.stdout.write('Writing file for locale "' + locale_code + '"\n');
    fs.writeFileSync(locale_path, locale_raw_content, 'utf8');
});
