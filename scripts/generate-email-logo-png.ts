import path from 'node:path';
import sharp from 'sharp';

async function main() {
  const projectRoot = process.cwd();
  const inputPath = path.join(projectRoot, 'public', 'tendo_sin_fondo', 'logo_negativo.svg');
  const outputPath = path.join(projectRoot, 'public', 'tendo_sin_fondo', 'logo_negativo.png');

  await sharp(inputPath)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Logo PNG generado: ${outputPath}`);
}

main().catch((error) => {
  console.error('Error generando logo PNG para email:', error);
  process.exit(1);
});
