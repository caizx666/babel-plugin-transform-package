import fs from 'fs';
import p from 'path';
import explodeClass from "babel-helper-explode-class";

export default function({
    types: t
}) {
    const VISITED = Symbol();

    function addBundleName(path, ref, state) {
        let packagejson;
        let ps = state.file.opts.sourceFileName.split(p.sep);
        for (let i = ps.length; i > 0; i--) {
            const searchPath = ps.slice(0, i - 1).join(p.sep);
            const packagefile = p.join(state.file.opts.sourceRoot, searchPath, 'package.json');
            if (fs.existsSync(packagefile)) {
                const cnt = fs.readFileSync(packagefile);
                if (cnt) {
                    packagejson = JSON.parse(cnt);
                }
                break;
            }
        }
        if (!packagejson) {
            // 没有找到package.json，试试workdir
            let fullpath = p.join(state.file.opts.sourceRoot, state.file.opts.sourceFileName);
            ps = fullpath.substr(process.cwd().length + 1).split(p.sep);
            for (let i = ps.length; i > 0; i--) {
                const searchPath = ps.slice(0, i - 1).join(p.sep);
                const packagefile = p.join(process.cwd(), searchPath, 'package.json');
                if (fs.existsSync(packagefile)) {
                    const cnt = fs.readFileSync(packagefile);
                    if (cnt) {
                        packagejson = JSON.parse(cnt);
                    }
                    break;
                }
            }
        }
        if (!packagejson) {
            // 还没有只能往上找package.json文件了
            ps = state.file.opts.sourceRoot.split(p.sep);
            for (let i = ps.length; i > 0; i--) {
                const searchPath = ps.slice(0, i - 1).join(p.sep);
                const packagefile = p.join(searchPath, 'package.json');
                if (fs.existsSync(packagefile)) {
                    const cnt = fs.readFileSync(packagefile);
                    if (cnt) {
                        packagejson = JSON.parse(cnt);
                    }
                    break;
                }
            }
        }
        if (!packagejson) {
            // 还没，没办法了
            console.log('not found package.json', state.file.opts.sourceFileName);
            return [];
        }
        return [t.assignmentExpression(
            "=",
            t.memberExpression(ref, t.identifier("$packageName")),
            t.stringLiteral(packagejson.name)
        ), t.assignmentExpression(
            "=",
            t.memberExpression(ref, t.identifier("$packageVersion")),
            t.stringLiteral(packagejson.version)
        )];
    }

    return {
        visitor: {
            ClassExpression(path) {
                const {
                    node
                } = path;
                if (node[VISITED]) return;
                node[VISITED] = true;

                explodeClass(path);

                const ref = path.scope.generateDeclaredUidIdentifier("cls");
                let nodes = [];

                nodes.push(t.assignmentExpression("=", ref, path.node));

                nodes = nodes.concat(addBundleName(path, ref, this));

                nodes.push(ref);

                path.replaceWith(t.sequenceExpression(nodes));
            },

            ClassDeclaration(path) {
                explodeClass(path);

                const ref = path.node.id;
                let nodes = [];

                nodes = nodes.concat(addBundleName(path, ref, this).map((expr) => t.expressionStatement(expr)));
                nodes.push(t.expressionStatement(ref));

                path.insertAfter(nodes);
            },
        }
    }
}
