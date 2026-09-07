import { Platform } from 'react-native';
import AuroraWeb, { AuroraProps } from './Aurora.web';
import AuroraNative from './Aurora.native';

export type { AuroraProps };

const Aurora: React.FC<AuroraProps> = Platform.OS === 'web' ? AuroraWeb : AuroraNative;

export default Aurora;
