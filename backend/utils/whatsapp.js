export const normalizeWhatsappNumber = (whatsapp) => {
  // Hapus semua karakter non-digit
  let number = whatsapp.replace(/\D/g, "");

  // Jika mulai 0, ganti jadi 62
  if (number.startsWith("0")) number = "62" + number.slice(1);

  return number;
};
