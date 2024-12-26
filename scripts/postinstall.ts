import { access, copyFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import c from 'picocolors'

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONFIGS_DIR = join(ROOT_DIR, 'src/configs')

async function cloneExampleFiles(directory: string) {
  try {
    const files = await readdir(directory)
    const exampleFiles = files.filter(
      (file) => file.endsWith('.example') || file.endsWith('.example.ts'),
    )

    await Promise.all(
      exampleFiles.map(async (file) => {
        const targetFile = file.replace('.example', '')
        const sourcePath = join(directory, file)
        const targetPath = join(directory, targetFile)
        try {
          await access(targetPath)
        } catch {
          await copyFile(sourcePath, targetPath)
          console.log(c.green(`Cloned: ${file} → ${targetFile}`))
        }
      }),
    )
  } catch (e) {
    console.error('Error cloning example files:', e)
  }
}

async function run() {
  await Promise.all([
    cloneExampleFiles(ROOT_DIR),
    cloneExampleFiles(CONFIGS_DIR),
  ])
}

run()
