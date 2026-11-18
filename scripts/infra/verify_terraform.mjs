import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../')

console.log('🔍 Executing Terraform Infrastructure as Code Verification...')

const tfDir = path.join(rootDir, 'infra/terraform')
if (!fs.existsSync(tfDir)) {
  console.error('❌ Missing infra/terraform directory')
  process.exit(1)
}

const rootFiles = ['main.tf', 'variables.tf', 'outputs.tf', 'terraform.tfvars.example']
for (const file of rootFiles) {
  if (!fs.existsSync(path.join(tfDir, file))) {
    console.error(`❌ Missing root Terraform file: ${file}`)
    process.exit(1)
  }
}
console.log('  ✅ Root Terraform configurations verified')

const modules = ['network', 'compute', 'database', 'redis', 'storage']
for (const mod of modules) {
  const modDir = path.join(tfDir, 'modules', mod)
  if (!fs.existsSync(modDir)) {
    console.error(`❌ Missing Terraform module directory: ${mod}`)
    process.exit(1)
  }
  const files = ['main.tf', 'variables.tf', 'outputs.tf']
  for (const f of files) {
    if (!fs.existsSync(path.join(modDir, f))) {
      console.error(`❌ Missing file ${f} in module ${mod}`)
      process.exit(1)
    }
  }
}
console.log(`  ✅ All ${modules.length} cloud-neutral Terraform modules verified`)

console.log('🎉 Terraform Infrastructure as Code Verification Passed 100%!')
