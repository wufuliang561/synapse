export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('邮箱地址不能为空');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('请输入有效的邮箱地址');
  } else if (email.length > 254) {
    errors.push('邮箱地址过长');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('密码不能为空');
  } else {
    if (password.length < 6) {
      errors.push('密码至少需要6个字符');
    }
    if (password.length > 128) {
      errors.push('密码过长');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username) {
    errors.push('用户名不能为空');
  } else {
    if (username.length < 2) {
      errors.push('用户名至少需要2个字符');
    }
    if (username.length > 30) {
      errors.push('用户名不能超过30个字符');
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      errors.push('用户名只能包含字母、数字、下划线和中文字符');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRegistration(email: string, username: string, password: string): ValidationResult {
  const emailValidation = validateEmail(email);
  const usernameValidation = validateUsername(username);
  const passwordValidation = validatePassword(password);

  const allErrors = [
    ...emailValidation.errors,
    ...usernameValidation.errors,
    ...passwordValidation.errors,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function validateLogin(email: string, password: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('邮箱地址不能为空');
  }
  if (!password) {
    errors.push('密码不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}