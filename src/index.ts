#!/usr/bin/env node
import { Command } from "commander";
import prompt from "prompts";
import fs from 'fs/promises';
import path from 'path';

const init = new Command()
    .name("")
    .description("Initialize a TypeScript project")
    .action(async () => {
        let options;
        try {
            options = await prompt([
                {
                    type: "text",
                    name: "projectName",
                    message: "What is the name of your project?",
                    initial: ".",
                },
                {
                    type: "select",
                    name: "strictness",
                    message: "How strict should the typescript compiler be?",
                    choices: [
                        { title: "Relaxed (Few checks)", value: "off" },
                        { title: "Balanced (Recommended)", value: "on" },
                        { title: "Rigorous (Maximum safety)", value: "strict" },
                    ],
                    initial: 1,
                },
                {
                    type: "confirm",
                    name: "isTranspiler",
                    message: "Are you transpiling using tsc?",
                    initial: true,
                },
                {
                    type: "confirm",
                    name: "isLibrary",
                    message: "Are you building a library?",
                    initial: false,
                },
                {
                    type: "confirm",
                    name: "isMonorepo",
                    message: "Are you building for a library in a monorepo?",
                    initial: false,
                },
                {
                    type: "confirm",
                    name: "isDom",
                    message: "Is your project for a dom (browser) environment?",
                    initial: false,
                },
            ], {
                onCancel: () => {
                    throw new Error('Operation cancelled');
                }
            });
        } catch (error) {
            console.log('Operation cancelled');
            process.exit(0);
        }

        if (!options || Object.keys(options).length === 0) {
            console.log('Operation cancelled');
            process.exit(0);
        }

        const projectDir = options.projectName === "." ? process.cwd() : path.join(process.cwd(), options.projectName);

        try {
            await fs.mkdir(projectDir, { recursive: true });

            const tsConfig = generateTsConfig(options);
            await fs.writeFile(path.join(projectDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
            console.log(`tsconfig.json has been generated in ${projectDir}`);
        } catch (error) {
            console.error('Error creating project files:', error);
            process.exit(1);
        }
    });

function generateTsConfig(options: {
    strictness: "off" | "on" | "strict";
    isTranspiler: boolean;
    isLibrary: boolean;
    isMonorepo: boolean;
    isDom: boolean;
}) {
    const config: { compilerOptions: Record<string, any> } = {
        compilerOptions: {
            esModuleInterop: true,
            skipLibCheck: true,
            target: "es2022",
            allowJs: true,
            resolveJsonModule: true,
            moduleDetection: "force",
            isolatedModules: true,
            verbatimModuleSyntax: true,
        }
    };

    // Strictness
    if (options.strictness === "strict") {
        config.compilerOptions.strict = true;
        config.compilerOptions.noUncheckedIndexedAccess = true;
        config.compilerOptions.noImplicitOverride = true;
    } else if (options.strictness === "on") {
        config.compilerOptions.strict = true;
    }

    // Transpiling
    if (options.isTranspiler) {
        config.compilerOptions.module = "NodeNext";
        config.compilerOptions.outDir = "dist";
        config.compilerOptions.sourceMap = true;
    } else {
        config.compilerOptions.module = "preserve";
        config.compilerOptions.noEmit = true;
    }

    // Library
    if (options.isLibrary) {
        config.compilerOptions.declaration = true;
    }

    // Monorepo
    if (options.isMonorepo) {
        config.compilerOptions.composite = true;
        config.compilerOptions.declarationMap = true;
    }

    // DOM
    if (options.isDom) {
        config.compilerOptions.lib = ["es2022", "dom", "dom.iterable"];
    } else {
        config.compilerOptions.lib = ["es2022"];
    }

    return config;
}

function main() {
    init.parse(process.argv);
}

main();