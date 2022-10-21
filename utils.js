const ssecret_api_url = "https://web-production-9c04.up.railway.app"
const SSAK = `${process.cwd()}\\.sscfg.json`
const SSEK = "sup3rs3cr3t4pp"
import axios from "axios"
import { spawn } from "child_process"
import { log } from "console"
import fs from "fs"
import inquirer from "inquirer"
import chalk from "chalk"
import Cryptr from "cryptr"
const decrypter = new Cryptr(SSEK)


/**
 * @param {string} email
 * @param {string} password 
 * This function first verifies if a sscfg.json file already
 */
export async function login() {
    const loggedIn = fs.existsSync(SSAK)
    if (!loggedIn) {
        const creds = await inquirer.prompt([
            {
                name: "email",
                message: "Enter your email"
            },
            {
                type: "password",
                name: "password",
                message: "Enter your password",

            }
        ]).then((answers) => {
            return answers
        })
        const { email, password } = creds
        if (email == "" || password == "") {
            log(chalk.red("SuperSecret: ❌ Both email and password can not be empty"))
            process.exit(1)
        }
        await axios.post(
            `${ssecret_api_url}/auth/login`,
            {
                email,
                password
            }
        )
            .then(async (res) => {
                try {
                    const { data } = res
                    const { token, USK } = data
                    log(token)
                    fs.writeFileSync(`${process.cwd()}\\.sscfg.json`, JSON.stringify({
                        token,
                        USK
                    }))
                    log(chalk.green(`SuperSecret: ✅ Successfully logged in`))
                } catch (error) {
                    log(chalk.red(`SuperSecret: ❌ Something went wrong`))
                    process.exit(1)
                }
            })
            .catch((err) => {
                const { status, data } = err.response
                switch (status) {
                    case 404:
                        log(chalk.yellowBright(`SuperSecret: ❌ ${data.message}`))
                        process.exit(1)
                    case 400:
                        log(chalk.red(`SuperSecret: ❌ ${data.message}`))
                        process.exit(1)
                    case 500:
                        log(chalk.red(`${data.message}`))
                        process.exit(1)
                }
            })
    }
    log(chalk.green(`SuperSecret: Seems like you are already logged in 🙂`))
}

/**
 * @param {string} project
 * @param {string} USK
 * This function is responsible of pulling the secrets and injecting them in your local process
 */
export async function pullSecrets( args ) {
    const projectID = process.argv[2]
    if (projectID == undefined) {
        log(chalk.red(`SuperSecret: ❌ Missing project ID`))
        process.exit(1)
    }
    const authData = fs.readFileSync(SSAK).toString()
    /**
     * @type { {token:string, USK:string} }
     */
    const jsonAuthData = JSON.parse(authData)
    log(chalk.green(`SuperSecret: 🔃Pulling secrets.....`))
    const pullResponse = await axios.post(
        `${ssecret_api_url}/project/fetch/secrets`,
        {
            project: projectID,
            USK: jsonAuthData.USK
        },
        {
            headers: {
                Authorization: `Bearer ${jsonAuthData.token}`
            }
        }
    )
        .then((res) => {
            log(chalk.green(`SuperSecret: 🔃Decrypting secrets.....`))
            const { data } = res.data
            /**
             * @type { { key:string, value:string }[] }
             */
            const { secrets } = JSON.parse(decrypter.decrypt(data))
            log(chalk.green(`SuperSecret: Injecting variables in local process`))
            secrets.forEach(element => {
                process.env[`${element.key}`] = element.value
            });
            log(process.pid)
            log(chalk.green(`SuperSecret: ✅Successfully pulled and injected variables`))
            log(args)
            const child = spawn(args[1], args.slice(2), {
                env: {
                    ...process.env,
                },
                shell: true
            });

            child.stdout.on("data", (data) => {
                console.log("" + data);
            });

            child.stderr.on("data", (data) => {
                console.log("stderr: " + data);
            });

            child.on("error", (error) => console.log("error: " + error.message));
            child.on("exit", (code, signal) => {
                if (code) console.log("Process exited with code " + code);
                if (signal) console.log("Process exited with signal " + signal);
            });
        })
        .catch((err) => {
            log(err)
            const { status, data } = err.response
            switch (status) {
                case 400:
                    log(chalk.red(`SuperSecret: ❌ Invalid projectID`))
                    process.exit(1)
                case 401:
                    log(chalk.red(`SuperSecret: ❗Invalid token, try login out and in again`))
                    process.exit(1)
                case 403:
                    log(chalk.red(`SuperSecret: ❗Invalid key, try login out and in again`))
                    process.exit(1)
                case 500:
                    log(chalk.red(`Something went wrong ${data.message}`))
                    process.exit(1)
            }
        })
}

