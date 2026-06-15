import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SECTOR_KEY = 'require_sector';

/**
 * Bu endpoint'e yalnızca belirtilen sektördeki (business_type) tenant'lar erişebilir.
 * SectorGuard ile beraber kullanılır. Plandan bağımsızdır.
 * Örn: @RequireSector('auto_service')
 */
export const RequireSector = (sector: string) => SetMetadata(REQUIRE_SECTOR_KEY, sector);
