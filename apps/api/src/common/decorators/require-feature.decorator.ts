import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_KEY = 'require_feature';

/**
 * Bu endpoint'e erişmek için tenant planında ilgili feature açık olmalı.
 * FeatureGuard ile beraber kullanılır.
 * Örn: @RequireFeature('quotes')
 */
export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE_KEY, feature);
