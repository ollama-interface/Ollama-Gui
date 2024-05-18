import { useMigration } from '@/hooks/use-migration';

export default function Migrator() {
	useMigration();
	return null;
}
