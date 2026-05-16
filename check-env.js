// check-env.js
const { execSync } = require('child_process');

console.log("--- Validando ambiente para Astro + TinaCMS ---");

try {
    const nodeVersion = execSync('node -v').toString().trim();
    const npmVersion = execSync('npm -v').toString().trim();
    
    console.log(`✅ Node.js detectado: ${nodeVersion}`);
    console.log(`✅ NPM detectado: ${npmVersion}`);

    // Astro requer Node.js v18.14.1 ou superior
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 18) {
        console.error("❌ Erro: O Astro exige Node.js v18.14.1 ou superior.");
    } else {
        console.log("🚀 Seu ambiente está pronto para o próximo passo!");
    }
} catch (error) {
    console.error("❌ Erro: Node.js não encontrado ou falha na execução.");
    console.log("Sugestão: Instale o Node.js LTS em https://nodejs.org/");
}