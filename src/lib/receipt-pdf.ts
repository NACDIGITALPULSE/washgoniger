import jsPDF from "jspdf";
import { Order } from "@/lib/services";

const paymentLabels: Record<string, string> = {
  cash: "Cash",
  nita: "Nita",
  amanata: "Amanata",
};

export const buildReceiptPDF = (order: Order) => {
  const optionsList =
    order.selectedOptions && order.selectedOptions.length > 0
      ? order.selectedOptions
      : [{ option: order.selectedOption, quantity: order.quantity }];

  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFontSize(22);
  doc.setTextColor(21, 101, 192);
  doc.text("WashGo", w / 2 - 18, y);
  doc.setTextColor(46, 125, 50);
  doc.text("Niger", w / 2 + 14, y);
  doc.setFontSize(10);
  doc.setTextColor(100);
  y += 6;
  doc.text("Services de lavage auto & pressing", w / 2, y, { align: "center" });

  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, y - 4, w - 40, 18, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("FACTURE N°", w / 2, y + 1, { align: "center" });
  doc.setFontSize(16);
  doc.setTextColor(21, 101, 192);
  doc.text(orderNumber, w / 2, y + 9, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(orderDate, w / 2, y + 14, { align: "center" });

  y += 24;
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(`Client : ${order.clientName}`, 15, y);
  y += 6;
  doc.text(`Téléphone : ${order.clientPhone}`, 15, y);
  y += 6;
  const lieuText =
    order.location === "domicile"
      ? "À domicile" + (order.address ? " — " + order.address : "")
      : "Sur place";
  doc.text(`Lieu : ${lieuText}`, 15, y);
  y += 6;
  doc.text(`Paiement : ${paymentLabels[order.payment] || order.payment}`, 15, y);

  y += 10;
  doc.setFillColor(21, 101, 192);
  doc.rect(15, y - 4, w - 30, 8, "F");
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.text("Service / Option", 18, y + 1);
  doc.text("Qté", w - 50, y + 1, { align: "right" });
  doc.text("Prix", w - 18, y + 1, { align: "right" });

  y += 8;
  doc.setFillColor(248, 249, 250);
  doc.rect(15, y - 4, w - 30, 7, "F");
  doc.setTextColor(50);
  doc.setFontSize(10);
  doc.text(`${order.service.icon} ${order.service.name}`, 18, y + 1);

  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(60);
  optionsList.forEach(({ option, quantity }) => {
    doc.text(option.name, 20, y + 1);
    const qtyStr = `${quantity}${option.unit === "kg" ? " kg" : ""}`;
    doc.text(qtyStr, w - 50, y + 1, { align: "right" });
    doc.text(
      `${(option.price * quantity).toLocaleString("fr-FR")} F`,
      w - 18,
      y + 1,
      { align: "right" },
    );
    doc.setDrawColor(230);
    doc.line(15, y + 4, w - 15, y + 4);
    y += 8;
  });

  y += 2;
  doc.setDrawColor(21, 101, 192);
  doc.setLineWidth(0.5);
  doc.line(15, y - 2, w - 15, y - 2);
  doc.setFontSize(13);
  doc.setTextColor(21, 101, 192);
  doc.text("TOTAL", 18, y + 4);
  doc.text(`${order.total.toLocaleString("fr-FR")} FCFA`, w - 18, y + 4, {
    align: "right",
  });

  y += 18;
  doc.setDrawColor(220);
  doc.line(15, y, w - 15, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(130);
  doc.text("Merci pour votre confiance ! +10 points fidélité 🎁", w / 2, y, {
    align: "center",
  });
  y += 5;
  doc.setTextColor(37, 211, 102);
  doc.text("WhatsApp : +227 88 08 29 87", w / 2, y, { align: "center" });
  y += 5;
  doc.setTextColor(130);
  doc.text("WashGo Niger — Niamey, Niger", w / 2, y, { align: "center" });

  return doc;
};

export const downloadReceiptPDF = (order: Order) => {
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  buildReceiptPDF(order).save(`Facture-${orderNumber}.pdf`);
};
