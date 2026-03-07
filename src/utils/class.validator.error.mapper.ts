export const classValidatorErrorMapper = (errors: any[]) => {
  return errors.map((err) => {
    let messages = Object.values(err.constraints || {});

    if (err.constraints && err.constraints.whitelistValidation) {
      messages = [`${err.property} alanı tanımlı değildir.`];
    }
    return {
      field: err.property,
      errors: messages,
    };
  });
};
