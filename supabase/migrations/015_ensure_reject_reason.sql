-- reject_reason カラムが存在しない場合の保険（014 が未適用の場合用）
ALTER TABLE koifes_ratings ADD COLUMN IF NOT EXISTS reject_reason TEXT[];
