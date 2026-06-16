const OPTIONS = {
  segment: ['Açaí','Sorvete / Gelato','Cafeteria','Delivery / Restaurante','Doceria','Indústria de alimentos','Eventos','Outro'],
  size: ['60 ml','100 ml','120 ml','180 ml','200 ml','240 ml','250 ml','300 ml','360 ml','500 ml','700 ml','750 ml','1000 ml','Outro tamanho'],
  monthlyVolume: ['Até 500','500 a 1.000','1.000 a 3.000','3.000 a 10.000','Acima de 10.000'],
  packagingType: ['Branca / sem personalização','Catálogo / pronta','Personalizada com minha marca','Ainda não sei'],
  usage: ['Delivery','Freezer','Vitrine','Consumo imediato','Transporte longo','Evento']
};

export function trackEvent(eventName, payload = {}) {
  console.log('[Guia de Embalagens analytics]', eventName, payload);
}

export function generatePackagingRecommendation(formData) {
  const segment = formData.segment || 'seu segmento';
  const product = (formData.product || 'produto').trim();
  const usage = formData.usage || [];
  const has = (value) => usage.includes(value);
  let recommendedType = 'Embalagem prática com tampa compatível';
  let suggestedSizes = [formData.size].filter(Boolean);
  const notes = [];

  if (['Açaí', 'Sorvete / Gelato'].includes(segment)) {
    recommendedType = has('Delivery') || has('Freezer') ? 'Pote de papel ou bowl com tampa compatível' : 'Pote de papel';
    suggestedSizes = ['240 ml', '360 ml', '500 ml', '750 ml', '1000 ml'];
    if (formData.size === '500 ml') recommendedType = 'Pote de papel 500 ml com tampa compatível';
  } else if (segment === 'Cafeteria') {
    recommendedType = 'Copo de papel';
    suggestedSizes = ['100 ml', '200 ml', '300 ml', '500 ml'];
    if (has('Consumo imediato')) notes.push('praticidade no balcão e no consumo imediato');
    if (has('Delivery')) notes.push('tampa compatível para reduzir vazamentos no delivery');
  } else if (segment === 'Doceria') {
    const sweetProduct = product.toLowerCase();
    recommendedType = sweetProduct.includes('bolo') || sweetProduct.includes('sobremesa') ? 'Pote ou copo para sobremesa' : 'Pote, copo ou caixa para doces';
    suggestedSizes = ['120 ml', '240 ml', '250 ml', '360 ml'];
  } else if (segment === 'Delivery / Restaurante') {
    recommendedType = 'Bowl, caixa, pote ou embalagem para transporte';
    suggestedSizes = ['360 ml', '500 ml', '750 ml', '1000 ml'];
    if (has('Transporte longo')) notes.push('resistência, fechamento seguro e compatibilidade com tampa');
  } else if (segment === 'Indústria de alimentos') {
    recommendedType = 'Embalagem definida por volume, conservação e logística';
    suggestedSizes = ['500 ml', '750 ml', '1000 ml'];
    notes.push('padronização, estoque e recorrência de compra');
  } else if (segment === 'Eventos') {
    recommendedType = 'Copos, potes ou embalagens práticas para distribuição';
    suggestedSizes = ['100 ml', '200 ml', '300 ml', '500 ml'];
    notes.push('compra por volume e facilidade de distribuição');
  }

  if (formData.size && formData.size !== 'Outro tamanho' && !suggestedSizes.includes(formData.size)) suggestedSizes.unshift(formData.size);

  const wantsCustom = formData.packagingType === 'Personalizada com minha marca';
  const lowVolume = ['Até 500', '500 a 1.000'].includes(formData.monthlyVolume);
  let minimumQuantity = 'Para volumes menores, embalagem branca ou de catálogo costuma ser o caminho mais simples para testar.';
  if (wantsCustom) minimumQuantity = 'Para personalização, o pedido ideal geralmente começa em 1.000 unidades por modelo.';
  if (lowVolume && wantsCustom) minimumQuantity += ' Como seu volume está abaixo de 1.000 unidades, avalie começar com embalagem branca/catálogo antes da personalização.';

  const volumeCost = {
    'Até 500': 'Baixo investimento',
    '500 a 1.000': 'Investimento intermediário',
    '1.000 a 3.000': wantsCustom ? 'Investimento intermediário' : 'Melhor custo por unidade em volume',
    '3.000 a 10.000': 'Melhor custo por unidade em volume',
    'Acima de 10.000': 'Melhor custo por unidade em volume'
  };
  const costRange = `${volumeCost[formData.monthlyVolume] || 'Investimento intermediário'}. O valor final depende de material, quantidade, personalização, tampa, impressão e fornecedor.`;
  const averageDeadline = wantsCustom
    ? 'Embalagens personalizadas: prazo médio pode variar conforme arte, aprovação, produção e entrega.'
    : 'Embalagens brancas/catálogo: disponibilidade pode ser mais rápida, conforme fornecedor.';
  const useText = usage.length ? ` com uso em ${usage.join(', ').toLowerCase()}` : '';
  const explanation = `Para ${product} de ${formData.size || 'tamanho informado'}${useText}, recomendamos ${recommendedType.toLowerCase()}. ${minimumQuantity}${notes.length ? ` Também considere ${notes.join(' e ')}.` : ''}`;

  return { recommendedType, suggestedSizes, minimumQuantity, costRange, averageDeadline, explanation, ctaText: 'Solicitar orçamento com fornecedores' };
}

function fillSelect(name) {
  const select = document.querySelector(`[name="${name}"]`);
  select.innerHTML = '<option value="">Selecione uma opção</option>' + OPTIONS[name].map((option) => `<option value="${option}">${option}</option>`).join('');
}

function getFormData(form) {
  return {
    segment: form.segment.value,
    product: form.product.value,
    size: form.size.value,
    monthlyVolume: form.monthlyVolume.value,
    packagingType: form.packagingType.value,
    usage: [...form.querySelectorAll('input[name="usage"]:checked')].map((item) => item.value)
  };
}

function renderResult(formData, recommendation) {
  document.querySelector('#result').innerHTML = `
    <p class="eyebrow">Resultado da simulação</p>
    <h2>${recommendation.recommendedType}</h2>
    <p>${recommendation.explanation}</p>
    <h3>Tamanhos sugeridos</h3><div class="pill-row">${recommendation.suggestedSizes.map((size) => `<span class="pill">${size}</span>`).join('')}</div>
    <ul class="result-list"><li><strong>Quantidade mínima sugerida:</strong> ${recommendation.minimumQuantity}</li><li><strong>Faixa estimada de custo:</strong> ${recommendation.costRange}</li><li><strong>Prazo médio:</strong> ${recommendation.averageDeadline}</li></ul>
    <div class="actions"><button id="quote-cta" class="button button--primary" type="button">${recommendation.ctaText}</button><a class="button button--secondary" href="mailto:contato@guiadeembalagens.com.br?subject=Falar%20com%20especialista">Falar com especialista</a><button id="redo" class="button button--secondary" type="button">Refazer simulação</button></div>`;
  document.querySelector('#quote-cta').addEventListener('click', () => {
    const payload = { ...formData, recommendation };
    localStorage.setItem('guia_embalagens_simulacao', JSON.stringify(payload));
    trackEvent('quote_cta_clicked', payload);
    const params = new URLSearchParams({ segment: formData.segment, product: formData.product, size: formData.size, monthlyVolume: formData.monthlyVolume, packagingType: formData.packagingType, usage: formData.usage.join(', '), recommendedType: recommendation.recommendedType });
    window.location.href = `/orcamento/?${params.toString()}`;
  });
  document.querySelector('#redo').addEventListener('click', () => document.querySelector('#simulator-form').reset());
}

function init() {
  ['segment', 'size', 'monthlyVolume', 'packagingType'].forEach(fillSelect);
  document.querySelector('#usage-options').innerHTML = OPTIONS.usage.map((option) => `<label class="option"><input type="checkbox" name="usage" value="${option}"> ${option}</label>`).join('');
  const form = document.querySelector('#simulator-form');
  const message = document.querySelector('#form-message');
  form.addEventListener('focusin', () => trackEvent('simulator_started'), { once: true });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = getFormData(form);
    if (!formData.segment || !formData.product.trim() || !formData.size || !formData.monthlyVolume || !formData.packagingType) {
      message.textContent = 'Preencha os campos obrigatórios para receber uma recomendação mais útil.';
      message.classList.remove('hidden');
      return;
    }
    message.classList.add('hidden');
    const recommendation = generatePackagingRecommendation(formData);
    trackEvent('simulator_completed', formData);
    renderResult(formData, recommendation);
  });
}

document.addEventListener('DOMContentLoaded', init);
