export const isLookback = type => /^(LBFLOATCALL|LBFLOATPUT|LBHIGHLOW)$/.test(type);

export const formula = (type, multiplier) => {
  const replacer = str => multiplier || str;
  const formulaMapping = {
    LBFLOATPUT : 'Multiplier x (High - Close)'.replace(/Multiplier/, replacer),
    LBFLOATCALL: 'Multiplier x (Close - Low)'.replace(/Multiplier/, replacer),
    LBHIGHLOW  : 'Multiplier x (High - Low)'.replace(/Multiplier/, replacer),
  };
  return formulaMapping[type];
};

export const barrierLabels = (type) => {
  const barrier_map = {
    LBFLOATCALL: ['Low'],
    LBFLOATPUT : ['High'],
    LBHIGHLOW  : ['High', 'Low'],
  };
  return barrier_map[type];
}

export const makeLookbackRequest = req => {
  const { amount } = req;
  const multiplier = amount ? +amount : 0;
  delete req.amount;
  delete req.basis;

  return { ...req, multiplier }
}

export default {
  isLookback,
  formula,
  barrierLabels,
  makeLookbackRequest
}
