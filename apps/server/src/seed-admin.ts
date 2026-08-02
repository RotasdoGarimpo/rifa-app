/**
 * Creates the single admin account.
 *
 * Sign-up is disabled on the live auth instance, so this builds its own with
 * that switch flipped and goes through the ordinary sign-up endpoint — no
 * hand-rolled hashing that could drift from what sign-in expects.
 *
 * Run with:
 *   bun run -F server seed:admin <usuario> '<senha>'
 *   bun run -F server seed:admin <usuario> '<senha>' --force   # replace
 *
 * Rotating the password means re-running this with --force: there is no email
 * provider wired up, so there is no reset flow either.
 */
import { createAuth } from "@rifa-app/auth/server";
import prisma from "@rifa-app/db";

const MIN_PASSWORD_LENGTH = 12;

function usage(message: string): never {
	console.error(
		`${message} Usage: bun run -F server seed:admin <usuario> '<senha>' [--force]`,
	);
	process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const [username, password] = args.filter((arg) => arg !== "--force");

if (!username || !password) {
	usage("Informe usuário e senha.");
}
if (username.length < 3 || username.length > 64) {
	usage("O usuário precisa ter entre 3 e 64 caracteres.");
}
if (password.length < MIN_PASSWORD_LENGTH) {
	usage(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
}

const existing = await prisma.user.findFirst();

if (existing && !force) {
	console.error(
		`Já existe um admin ("${existing.username ?? existing.email}"). Use --force para substituí-lo.`,
	);
	process.exit(1);
}

if (existing) {
	// Sessions and the credential account cascade off the user row.
	await prisma.user.deleteMany();
	console.log("Admin anterior removido.");
}

const auth = createAuth({ disableSignUp: false });

await auth.api.signUpEmail({
	body: {
		username,
		displayUsername: username,
		name: username,
		// Synthetic: nothing is ever sent to it. Email verification and password
		// reset are both off, and sign-in goes through the username.
		email: `${username}@rifa.local`,
		password,
	},
});

console.log(`Admin "${username}" criado.`);
await prisma.$disconnect();
