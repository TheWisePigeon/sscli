#!/usr/bin/env node
const SSEK = "sup3rs3cr3t4pp"
const SSAK = `${process.cwd()}\\.sscfg.json`
import fs from "fs"
import { login, pullSecrets } from "./utils.js"
import chalk from "chalk"
import {log} from "console"

console.log(`
    Welcome to 🔒SuperSecret🔒 CLI
`)

log()
if(process.argv[2]=="logout"){
    log(chalk.redBright(`SuperSecret: 🔓Logging you out`))
    if(!fs.existsSync(SSAK)){
        log(chalk.red(`SuperSecret: You are not logged in`))
        process.exit(1)
    }
    fs.rmSync(SSAK)
    log(chalk.greenBright(`SuperSecret: ✅ You successfully looged out`))
    process.exit(0)
}

await login()
await pullSecrets(process.argv.slice(2))