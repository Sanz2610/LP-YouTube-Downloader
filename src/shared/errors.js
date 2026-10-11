const SECRET=/(?:https?:\/\/[^\s]+|(?:cookie|token|signature|sig|expire|authorization|credential|key|secret)[=:][^\s&]+)/ig;
export function sanitizeError(error){const text=String(error?.message||error||'').replace(SECRET,'[đã ẩn]');return text.length>240?text.slice(0,237)+'…':text;}
export function publicError(error,fallback='Không tải được dữ liệu YouTube. Thử lại sau.'){const safe=sanitizeError(error);return safe&&safe!=='[đã ẩn]'?safe:fallback;}
