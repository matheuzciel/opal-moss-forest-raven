export async function makeSampleFile(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1066;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível criar a amostra");

  ctx.fillStyle = "#2a2723";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1816";
  ctx.fillRect(0, 0, canvas.width, 90);

  ctx.fillStyle = "#d9d3c6";
  ctx.fillRect(180, 140, 460, 620);
  ctx.fillStyle = "#b7b1a4";
  ctx.fillRect(400, 140, 18, 620);
  ctx.fillRect(180, 430, 460, 16);
  ctx.fillStyle = "#8d887c";
  ctx.fillRect(214, 176, 160, 220);
  ctx.fillRect(430, 176, 176, 220);
  ctx.fillRect(214, 470, 160, 250);
  ctx.fillRect(430, 470, 176, 250);

  ctx.fillStyle = "#3c362f";
  ctx.beginPath();
  ctx.moveTo(0, 760);
  ctx.lineTo(1600, 820);
  ctx.lineTo(1600, 1066);
  ctx.lineTo(0, 1066);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2c2824";
  ctx.fillRect(860, 700, 280, 36);
  ctx.fillStyle = "#6e4d38";
  ctx.fillRect(900, 640, 200, 64);

  ctx.fillStyle = "#efeae1";
  ctx.beginPath();
  ctx.ellipse(1180, 760, 78, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d7d0c4";
  ctx.fillRect(1110, 600, 140, 164);
  ctx.fillStyle = "#f4f0e8";
  ctx.beginPath();
  ctx.ellipse(1180, 600, 70, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c8c0b4";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(1248, 680, 36, Math.PI * 0.7, Math.PI * 1.5);
  ctx.stroke();

  ctx.fillStyle = "#243028";
  ctx.beginPath();
  ctx.ellipse(640, 790, 90, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#314237";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(640, 790);
  ctx.lineTo(640, 700);
  ctx.stroke();
  ctx.fillStyle = "#3e5a48";
  ctx.beginPath();
  ctx.ellipse(610, 700, 46, 22, -0.4, 0, Math.PI * 2);
  ctx.ellipse(670, 692, 50, 24, 0.5, 0, Math.PI * 2);
  ctx.fill();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("amostra inválida"))), "image/jpeg", 0.92);
  });
  return new File([blob], "amostra.jpg", { type: "image/jpeg" });
}
