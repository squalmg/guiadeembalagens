(function () {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const RECOMMENDATIONS = {
    "Açaí": "pote ou bowl com tampa firme, boa apresentação e opção personalizada para reforçar marca",
    "Sorvete": "pote com boa vedação, resistência a baixa temperatura e logística bem planejada",
    "Cafeteria": "copo com tampa compatível, boa pega e alternativa personalizada para recorrência",
    "Delivery": "caixa, pote ou sacola com foco em vedação, empilhamento e transporte",
    "Doceria": "embalagem com apresentação premium, proteção e boa visibilidade do produto",
    "Indústria": "embalagem padronizada, compra recorrente, especificação técnica e fornecedor estável",
    "Eventos": "embalagem de pronta entrega ou personalizada com prazo muito bem validado"
  };

  const ROUTES = {
    hot: {
      label: "Lead quente",
      route: "Encaminhar para Natucopos ou parceiro premium",
      css: "hot",
      explanation: "Quantidade alta, urgência e/ou embalagem personalizada. Precisa de abordagem comercial rápida."
    },
    medium: {
      label: "Lead médio",
      route: "Entrar em nutrição via WhatsApp",
      css: "medium",
      explanation: "Existe intenção real, mas talvez ainda esteja comparando opções ou prazo."
    },
    weak: {
      label: "Lead fraco",
      route: "Enviar conteúdo automático e manter na base",
      css: "weak",
      explanation: "Baixa quantidade, pouca urgência ou perfil de pesquisa inicial."
    }
  };

  function uid() {
    return "GE-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function normalizePhone(input) {
    const digits = onlyDigits(input);
    if (!digits) return "";
    if (digits.startsWith("55")) return digits;
    return "55" + digits;
  }

  function maskPhone(input) {
    let v = onlyDigits(input.value).slice(0, 11);
    if (v.length > 10) {
      input.value = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3").replace(/-$/, "");
    } else if (v.length > 6) {
      input.value = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").replace(/-$/, "");
    } else if (v.length > 2) {
      input.value = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      input.value = v;
    }
  }

  function classifyLead(data) {
    const quantity = Number(data.estimated_quantity || 0);
    const custom = data.needs_custom === "sim" || data.needs_custom === "talvez";
    const urgent = data.desired_deadline === "urgente" || data.desired_deadline === "15";
    const strategicSegments = ["Açaí", "Sorvete", "Cafeteria", "Delivery", "Indústria"];
    const strategic = strategicSegments.includes(data.segment);

    let score = 0;
    if (quantity >= 10000) score += 50;
    else if (quantity >= 5000) score += 38;
    else if (quantity >= 2000) score += 26;
    else if (quantity >= 1000) score += 16;
    else if (quantity >= 500) score += 8;

    if (custom) score += 26;
    if (urgent) score += 20;
    if (strategic) score += 8;
    if (data.notes && data.notes.trim().length > 18) score += 5;

    if ((quantity >= 5000 && custom) || (quantity >= 2000 && custom && urgent) || score >= 62) return { key: "hot", score };
    if (quantity >= 1000 || custom || score >= 28) return { key: "medium", score };
    return { key: "weak", score };
  }

  function collectForm(form) {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.estimated_quantity = Number(data.estimated_quantity || 0);
    data.whatsapp_e164 = normalizePhone(data.whatsapp);
    data.created_at = new Date().toISOString();
    data.page = location.pathname;
    data.utm_source = new URLSearchParams(location.search).get("utm_source") || "direct";
    data.utm_medium = new URLSearchParams(location.search).get("utm_medium") || "none";
    data.utm_campaign = new URLSearchParams(location.search).get("utm_campaign") || "none";
    data.lead_id = uid();
    const classification = classifyLead(data);
    data.lead_score = classification.score;
    data.lead_temperature = classification.key;
    data.lead_label = ROUTES[classification.key].label;
    data.routing_recommendation = ROUTES[classification.key].route;
    return data;
  }

  function saveLocalLead(data) {
    const key = "guia_embalagens_leads";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift(data);
    localStorage.setItem(key, JSON.stringify(current.slice(0, 300)));
  }

  async function sendToDatabase(data) {
    const endpoint = window.GE_API_ENDPOINT || "/api/leads";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Falha ao gravar no endpoint configurado");
    return response.json();
  }

  function showLeadResult(data, persisted) {
    const result = $("#leadResult");
    const route = ROUTES[data.lead_temperature];
    result.hidden = false;
    result.innerHTML = `
      <strong>Solicitação registrada: ${data.lead_id}</strong>
      <span>${route.explanation}</span>
      <div class="badge ${route.css}">${route.label}</div>
      <p style="margin:12px 0 0;color:var(--muted)"><b>Rota recomendada:</b> ${route.route}.</p>
      <p style="margin:6px 0 0;color:var(--muted)"><b>Status dos dados:</b> ${persisted ? "enviado ao banco/API" : "salvo localmente; configure o backend para produção"}.</p>
    `;
  }

  function showError(message) {
    const box = $("#formStatus");
    box.className = "form-status error";
    box.textContent = message;
  }

  function clearError() {
    const box = $("#formStatus");
    box.className = "form-status";
    box.textContent = "";
  }

  function fillQuoteFromSimulator(payload) {
    const form = $("#quoteForm");
    if (!form) return;
    const segment = form.elements.segment;
    const type = form.elements.packaging_type;
    const qty = form.elements.estimated_quantity;
    const custom = form.elements.needs_custom;
    const notes = form.elements.notes;
    segment.value = payload.segment || "";
    qty.value = payload.quantity || "";
    custom.value = payload.custom || "";
    const recommendedType = guessPackagingType(payload.segment);
    if (recommendedType) type.value = recommendedType;
    notes.value = `Simulador: produto ${payload.product || "não informado"}. Recomendação inicial: ${payload.recommendation}.`;
  }

  function guessPackagingType(segment) {
    const map = {
      "Açaí": "Potes",
      "Sorvete": "Potes",
      "Cafeteria": "Copos",
      "Delivery": "Caixas",
      "Doceria": "Caixas",
      "Indústria": "Outro",
      "Eventos": "Copos"
    };
    return map[segment] || "Outro";
  }

  function initMenu() {
    const toggle = $(".menu-toggle");
    const mobile = $(".mobile-nav");
    if (!toggle || !mobile) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      mobile.hidden = expanded;
    });
    $$(".mobile-nav a").forEach((link) => link.addEventListener("click", () => {
      mobile.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  function initReveal() {
    const items = $$(".reveal, .reveal-group");
    if (!window.IntersectionObserver) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => obs.observe(item));
  }

  function initSimulator() {
    const form = $("#quickSimulator");
    const output = $("#simResult");
    if (!form || !output) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const segment = $("#simSegment").value;
      const product = $("#simProduct").value.trim();
      const quantity = Number($("#simQty").value || 0);
      const custom = $("#simCustom").value;
      const recommendation = RECOMMENDATIONS[segment] || "embalagem adequada ao produto, volume e prazo";
      const quoteData = { segment, product, quantity, custom, recommendation };
      const customText = custom === "sim" ? "com personalização" : "de pronta entrega";
      const minAdvice = quantity < 1000 ? "Como a quantidade é baixa, vale filtrar fornecedores de pronta entrega ou conteúdos automáticos." : "A quantidade já permite cotação com fornecedores comerciais.";

      output.hidden = false;
      output.innerHTML = `
        <strong>Recomendação inicial:</strong> para ${segment.toLowerCase()}, avalie ${recommendation}.
        <br>${quantity.toLocaleString("pt-BR")} unidades/mês ${customText}. ${minAdvice}
        <br><a href="#orcamento" id="sendSimToQuote">Usar esses dados no orçamento →</a>
      `;
      const link = $("#sendSimToQuote");
      link.addEventListener("click", () => fillQuoteFromSimulator(quoteData), { once: true });
    });
  }

  function initSegmentCards() {
    $$(".segment-card").forEach((card) => {
      card.addEventListener("click", () => {
        const segment = card.dataset.segment;
        const form = $("#quoteForm");
        if (form) form.elements.segment.value = segment;
        location.hash = "orcamento";
      });
    });
  }

  function initQuoteForm() {
    const form = $("#quoteForm");
    if (!form) return;
    const phone = form.elements.whatsapp;
    phone.addEventListener("input", () => maskPhone(phone));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearError();
      if (!form.checkValidity()) {
        showError("Preencha os campos obrigatórios para classificar o lead corretamente.");
        form.reportValidity();
        return;
      }
      const data = collectForm(form);
      const submit = form.querySelector("button[type='submit']");
      const original = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Enviando...";

      let persisted = false;
      try {
        await sendToDatabase(data);
        persisted = true;
      } catch (error) {
        saveLocalLead(data);
      } finally {
        submit.disabled = false;
        submit.textContent = original;
        showLeadResult(data, persisted);
        form.reset();
      }
    });
  }

  function initTracking() {
    $$("[data-track]").forEach((el) => {
      el.addEventListener("click", () => {
        const eventName = el.dataset.track;
        const event = { event: eventName, at: new Date().toISOString(), path: location.pathname };
        const key = "guia_embalagens_events";
        const current = JSON.parse(localStorage.getItem(key) || "[]");
        current.unshift(event);
        localStorage.setItem(key, JSON.stringify(current.slice(0, 200)));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    initReveal();
    initSimulator();
    initSegmentCards();
    initQuoteForm();
    initTracking();
  });
})();
