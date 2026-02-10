import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"

export const loadCommands = async (commandsPath) => {
  const commands = new Map()

  const walk = async (dir) => {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)

      if (fs.statSync(fullPath).isDirectory()) {
        await walk(fullPath)
      } else if (file.endsWith(".js")) {
        const module = await import(pathToFileURL(fullPath))
        const command = module.default

        if (!command?.name) continue
        commands.set(command.name, command)
      }
    }
  }

  await walk(commandsPath)
  return commands
}
