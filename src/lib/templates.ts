// Message Template Types & Constants
// Shared between server actions and client components.
// Cannot live in a "use server" file because only async functions can be exported from those.

export type MessageTemplateType =
  | "confirmation"
  | "confirm_request"
  | "confirm_reminder"
  | "pre_appointment"
  | "cancellation"
  | "review_request"
  | "reactivation"
  | "waitlist_notify";

export interface MessageTemplate {
  id: string;
  type: MessageTemplateType;
  body_template: string;
  active: boolean;
}

export const DEFAULT_TEMPLATES: Record<MessageTemplateType, string> = {
  confirmation:
    "Ciao {{client_name}}! Prenotazione registrata per {{service_name}} il {{date}} alle {{time}} presso {{business_name}}, {{business_address}}. Ti chiederemo conferma il giorno dell'appuntamento.",
  confirm_request:
    "Ciao {{client_name}}, hai un appuntamento per {{service_name}} il {{date}} alle {{time}} presso {{business_name}}.\n\nRispondi:\n✅ CONFERMA — per confermare\n❌ CANCELLA — per cancellare\n🔄 CAMBIA ORARIO — per riprogrammare\n\nSe non rispondi entro le {{deadline}}, l'appuntamento verrà automaticamente cancellato.",
  confirm_reminder:
    "⏰ {{client_name}}, ti ricordiamo di confermare il tuo appuntamento per {{service_name}} alle {{time}}.\n\nRispondi CONFERMA entro le {{deadline}} o verrà cancellato.\n\nPer cancellare: CANCELLA\nPer cambiare orario: CAMBIA ORARIO",
  pre_appointment:
    "✅ {{client_name}}, ci vediamo tra poco!\n\n📍 {{business_name}}, {{business_address}}\n🕐 Oggi alle {{time}} — {{service_name}}\n\nPer qualsiasi cosa, scrivici qui!",
  cancellation:
    "{{client_name}}, il tuo appuntamento per {{service_name}} del {{date}} alle {{time}} è stato cancellato.\n\nPrenota di nuovo quando vuoi → {{booking_link}}",
  review_request:
    "Grazie {{client_name}}! Com'è andata? Lasciaci una recensione su Google, ci aiuti tantissimo → {{review_link}}",
  reactivation:
    "Ciao {{client_name}}, è passato un po'! Vuoi prenotare il prossimo taglio? Prenota qui → {{booking_link}}",
  waitlist_notify:
    "Ciao {{client_name}}! Si è liberato un posto il {{date}} alle {{time}} per {{service_name}}. Vuoi prenotare? Rispondi SI.",
};

export const TEMPLATE_LABELS: Record<MessageTemplateType, string> = {
  confirmation: "Conferma prenotazione",
  confirm_request: "Richiesta conferma appuntamento",
  confirm_reminder: "Reminder conferma (secondo avviso)",
  pre_appointment: "Promemoria pre-appuntamento",
  cancellation: "Cancellazione",
  review_request: "Richiesta recensione Google",
  reactivation: "Riattivazione cliente dormiente",
  waitlist_notify: "Notifica lista d'attesa",
};

export const TEMPLATE_DESCRIPTIONS: Record<MessageTemplateType, string> = {
  confirmation: "Inviato subito dopo la prenotazione",
  confirm_request: "Inviato la sera prima o la mattina del giorno dell'appuntamento (timing smart)",
  confirm_reminder: "Secondo avviso se il cliente non ha risposto al primo",
  pre_appointment: "Inviato ~2 ore prima agli appuntamenti confermati",
  cancellation: "Inviato quando un appuntamento viene cancellato o non confermato",
  review_request: "Inviato 2 ore dopo un appuntamento completato",
  reactivation: "Inviato ai clienti che non prenotano da tempo",
  waitlist_notify: "Inviato quando si libera uno slot dalla lista d'attesa",
};
