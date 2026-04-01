import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../shared/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
