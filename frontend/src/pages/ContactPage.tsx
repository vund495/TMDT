import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import MapEmbed from "../components/MapEmbed";
import { submitFeedback } from "../lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const send = useMutation({
    mutationFn: () => submitFeedback({ name, email, subject: subject || undefined, message }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-ceramic-900">Liên hệ & góp ý</h1>
      <p className="mt-1 text-sm text-gray-600">
        Gửi thắc mắc hoặc góp ý cho đội ngũ Gốm Việt.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ceramic-100">
        <MapEmbed address="Làng gốm Bát Tràng, Gia Lâm, Hà Nội" className="h-64 w-full" />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        🏺 Làng gốm Bát Tràng, Gia Lâm, Hà Nội · hotro@vietcraft.vn
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name && email && message) send.mutate();
        }}
        className="mt-6 space-y-3 rounded-xl border border-ceramic-100 bg-white p-5"
      >        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Họ tên *"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email *"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Chủ đề (tùy chọn)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nội dung *"
          className="w-full rounded-md border border-gray-300 p-3 text-sm"
          rows={4}
        />
        <button
          type="submit"
          disabled={send.isPending}
          className="rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90 disabled:opacity-50"
        >
          {send.isPending ? "Đang gửi..." : "Gửi"}
        </button>
        {send.isSuccess && <p className="text-sm text-green-600">✅ Cảm ơn! Chúng tôi đã nhận được phản hồi.</p>}
        {send.isError && <p className="text-sm text-red-600">{(send.error as Error).message}</p>}
      </form>
    </div>
  );
}
