import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Phone, Download, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  phone: string;
  text: string;
  pdfUrl?: string;
  onDownload: () => void;
  onClose: () => void;
}

export const WhatsAppShareFallback = ({ phone, text, pdfUrl, onDownload, onClose }: Props) => {
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-4 right-4 z-50 bg-background rounded-3xl p-5 shadow-2xl border border-border space-y-4 max-w-sm mx-auto"
    >
      <div className="text-center">
        <div className="text-3xl mb-2">📱</div>
        <h3 className="font-bold text-foreground">Envoyer sur WhatsApp</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Copiez le lien du reçu puis collez-le dans WhatsApp, ou téléchargez le PDF.
        </p>
      </div>

      <div className="rounded-xl bg-muted/50 p-3 space-y-2 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Destinataire</span>
          <span className="text-sm font-bold text-foreground">+{phone}</span>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-[11px] text-primary underline break-all bg-background rounded-lg p-2 border border-border"
          >
            {pdfUrl}
          </a>
        )}
        <textarea
          readOnly
          value={text}
          className="w-full bg-background rounded-lg p-2 text-[11px] text-foreground border border-border resize-none h-20"
        />
      </div>

      {pdfUrl && (
        <Button
          variant="outline"
          className="w-full rounded-xl h-11 border-primary/30 text-primary hover:bg-primary/5"
          onClick={async () => {
            await navigator.clipboard.writeText(pdfUrl);
            toast.success("Lien du reçu copié !");
          }}
        >
          <LinkIcon className="w-4 h-4 mr-1.5" /> Copier le lien du reçu PDF
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="rounded-xl h-11"
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success("Message copié !");
          }}
        >
          <Copy className="w-4 h-4 mr-1.5" /> Copier message
        </Button>
        <Button
          className="rounded-xl h-11 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
          onClick={() => window.open(waUrl, "_blank")}
        >
          <Phone className="w-4 h-4 mr-1.5" /> Ouvrir WhatsApp
        </Button>
      </div>

      {pdfUrl && (
        <Button
          variant="ghost"
          className="w-full rounded-xl h-10 text-xs"
          onClick={() => window.open(pdfUrl, "_blank")}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Aperçu du PDF
        </Button>
      )}

      <Button variant="outline" className="w-full rounded-xl h-11" onClick={onDownload}>
        <Download className="w-4 h-4 mr-1.5" /> Télécharger le reçu PDF
      </Button>

      <Button variant="ghost" className="w-full rounded-xl" onClick={onClose}>
        Fermer
      </Button>
    </motion.div>
  );
};
