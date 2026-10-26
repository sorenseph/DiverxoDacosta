// server/mail.ts
var kinds = /* @__PURE__ */ new Set([
	"registro",
	"reservacion",
	"cotizacion",
	"cancelacion",
	"codigo"
]);
function text(value, max) {
	return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function parseMailRequest(value) {
	if (!value || typeof value !== "object") return null;
	const body = value;
	const kind = body.kind;
	const to = text(body.to, 160);
	const name = text(body.name, 120);
	if (!kinds.has(kind) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || name.length < 2) return null;
	const lines = Array.isArray(body.lines) ? body.lines.slice(0, 12).flatMap((line) => {
		if (!line || typeof line !== "object") return [];
		const item = line;
		const amount = item.amountMxn;
		if (typeof amount !== "number" || !Number.isFinite(amount)) return [];
		return [{
			label: text(item.label, 80),
			detail: text(item.detail, 180),
			amountMxn: amount
		}];
	}) : [];
	return {
		kind,
		to,
		name,
		folio: text(body.folio, 40),
		when: text(body.when, 120),
		space: text(body.space, 80),
		guests: typeof body.guests === "number" && Number.isInteger(body.guests) ? body.guests : void 0,
		message: text(body.message, 800),
		lines,
		totalMxn: typeof body.totalMxn === "number" && Number.isFinite(body.totalMxn) ? body.totalMxn : void 0,
		code: text(body.code, 8)
	};
}
function pesos(amount) {
	return new Intl.NumberFormat("es-MX", {
		style: "currency",
		currency: "MXN",
		maximumFractionDigits: 0
	}).format(amount);
}
function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
function renderMail(request) {
	const name = escapeHtml(request.name);
	if (request.kind === "codigo") {
		const code = escapeHtml(request.code ?? "");
		return {
			subject: "Tu código de DiverxoDacosta",
			text: `Hola ${request.name}. Tu código es ${request.code ?? ""}. Caduca en 10 minutos.`,
			html: `<p>Hola ${name}.</p><p>Tu código de confirmación es <strong style="letter-spacing:0.2em;font-size:1.4rem">${code}</strong>.</p><p>Caduca en 10 minutos. Si no solicitaste este código, puedes ignorar el mensaje.</p>`
		};
	}
	if (request.kind === "registro") return {
		subject: "Tu cuenta en DiverxoDacosta",
		text: `Hola ${request.name}. Ya puedes entrar a tu cuenta y seguir tus reservaciones.`,
		html: `<p>Hola ${name}.</p><p>Tu cuenta en DiverxoDacosta quedó registrada. Desde ahí puedes seguir tus reservaciones y cotizaciones.</p>`
	};
	if (request.kind === "cotizacion") {
		const subject = "Recibimos tu solicitud de cotización";
		const detail = request.message ? `<p>${escapeHtml(request.message)}</p>` : "";
		return {
			subject,
			text: `Hola ${request.name}. Recibimos tu solicitud. ${request.message ?? ""}`,
			html: `<p>Hola ${name}.</p><p>Recibimos tu solicitud de cotización. Te contactamos para confirmar disponibilidad y el detalle del evento.</p>${detail}`
		};
	}
	if (request.kind === "cancelacion") return {
		subject: `Reservación ${request.folio ?? ""} cancelada`,
		text: `Hola ${request.name}. La reservación ${request.folio ?? ""} quedó cancelada y el horario volvió a estar libre.`,
		html: `<p>Hola ${name}.</p><p>La reservación <strong>${escapeHtml(request.folio ?? "")}</strong> quedó cancelada. El horario volvió a estar libre.</p>`
	};
	const rows = (request.lines ?? []).map((line) => `<tr><td>${escapeHtml(line.label)}<br><small>${escapeHtml(line.detail)}</small></td><td>${pesos(line.amountMxn)}</td></tr>`).join("");
	const total = request.totalMxn === void 0 ? "" : `<p><strong>Total estimado: ${pesos(request.totalMxn)}</strong></p>`;
	return {
		subject: `Reservación ${request.folio ?? ""} · DiverxoDacosta`,
		text: [
			`Hola ${request.name}.`,
			`Folio ${request.folio ?? ""}.`,
			request.space ? `Espacio: ${request.space}.` : "",
			request.when ? `Cuándo: ${request.when}.` : "",
			request.guests ? `Invitados: ${request.guests}.` : "",
			...(request.lines ?? []).map((line) => `${line.label}: ${pesos(line.amountMxn)}`),
			request.totalMxn === void 0 ? "" : `Total estimado: ${pesos(request.totalMxn)}.`,
			"Presupuesto estimado sujeto a disponibilidad, confirmación de servicios y cotización final."
		].filter(Boolean).join("\n"),
		html: `<p>Hola ${name}.</p><p>Recibimos tu reservación con el folio <strong>${escapeHtml(request.folio ?? "")}</strong>.</p><p>${escapeHtml(request.space ?? "")}<br>${escapeHtml(request.when ?? "")}<br>${request.guests ? `${request.guests} invitados` : ""}</p><table>${rows}</table>${total}<p>Presupuesto estimado sujeto a disponibilidad, confirmación de servicios y cotización final.</p>`
	};
}
var resendTestFrom = "DiverxoDacosta <onboarding@resend.dev>";
async function postMail(request, env, message) {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			from: env.from,
			to: [request.to],
			reply_to: "israelcardenas6@gmail.com",
			subject: message.subject,
			html: message.html,
			text: message.text
		})
	});
	if (response.ok) return { ok: true };
	const detail = await response.text();
	return {
		ok: false,
		status: response.status,
		error: detail.slice(0, 400)
	};
}
async function deliverMail(request, env) {
	const message = renderMail(request);
	const first = await postMail(request, env, message);
	if (first.ok) return { ok: true };
	if (first.status === 403 && /not verified/i.test(first.error) && env.from !== resendTestFrom) {
		const second = await postMail(request, {
			...env,
			from: resendTestFrom
		}, message);
		if (second.ok) return { ok: true };
		return {
			ok: false,
			error: second.error
		};
	}
	return {
		ok: false,
		error: first.error
	};
}
// server/routes/email.ts
async function readJson(request) {
	if (request.body && typeof request.body === "object") return request.body;
	if (typeof request.body === "string") return JSON.parse(request.body);
	const raw = await new Promise((resolve, reject) => {
		const chunks = [];
		request.on("data", (chunk) => {
			if (chunk) chunks.push(chunk);
		});
		request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
		request.on("error", () => reject(/* @__PURE__ */ new Error("No se pudo leer la solicitud.")));
	});
	return raw ? JSON.parse(raw) : null;
}
async function handler(request, response) {
	response.setHeader("Content-Type", "application/json");
	if (request.method !== "POST") {
		response.status(405).json({
			ok: false,
			error: "Método no permitido."
		});
		return;
	}
	const apiKey = process.env.RESEND_API_KEY ?? "";
	const from = process.env.RESEND_FROM ?? "DiverxoDacosta <israelcardenas6@gmail.com>";
	if (!apiKey) {
		response.status(500).json({
			ok: false,
			error: "Falta la clave de correo en el servidor."
		});
		return;
	}
	try {
		const mail = parseMailRequest(await readJson(request));
		if (!mail) {
			response.status(400).json({
				ok: false,
				error: "La solicitud de correo está incompleta."
			});
			return;
		}
		const result = await deliverMail(mail, {
			apiKey,
			from
		});
		response.status(result.ok ? 200 : 502).json(result);
	} catch {
		response.status(400).json({
			ok: false,
			error: "No se pudo leer el correo a enviar."
		});
	}
}
export { handler as default };
