<script lang="ts">
	import NachrichtenView, { type Contact } from '$lib/components/nachrichten-view.svelte';

	const contacts: Contact[] = [
		{
			id: '1',
			name: 'Anna Müller',
			subtitle: 'Sachbearbeiterin · Stadt Osnabrück',
			initials: 'AM',
			lastMessage: 'Vielen Dank, ich leite die Unterlagen weiter.',
			lastTime: '10:15',
			unread: 1,
			online: true,
			messages: [
				{ from: 'me', text: 'Guten Morgen, anbei die unterschriebenen Verträge.', time: '09:50' },
				{ from: 'them', text: 'Guten Morgen, vielen Dank!', time: '10:14' },
				{ from: 'them', text: 'Vielen Dank, ich leite die Unterlagen weiter.', time: '10:15' }
			]
		},
		{
			id: '2',
			name: 'Markus Schneider',
			subtitle: 'Fallmanager · Sozialamt',
			initials: 'MS',
			lastMessage: 'Der Mieter zieht am 01.06. ein.',
			lastTime: 'Gestern',
			unread: 0,
			online: false,
			messages: [
				{ from: 'them', text: 'Hallo, wir hätten einen Kandidaten für die Wohnung in der Goethestraße.', time: 'Gestern 11:00' },
				{ from: 'me', text: 'Gerne, schicken Sie mir die Unterlagen.', time: 'Gestern 11:30' },
				{ from: 'them', text: 'Der Mieter zieht am 01.06. ein.', time: 'Gestern 15:45' }
			]
		},
		{
			id: '3',
			name: 'Petra Lange',
			subtitle: 'Sachbearbeiterin · Wohnungsamt',
			initials: 'PL',
			lastMessage: 'Können Sie die Wohnung noch einmal freigeben?',
			lastTime: 'Di',
			unread: 2,
			online: true,
			messages: [
				{ from: 'them', text: 'Die Vermittlung in der Lindenallee ist leider geplatzt.', time: 'Di 09:10' },
				{ from: 'them', text: 'Können Sie die Wohnung noch einmal freigeben?', time: 'Di 09:12' }
			]
		},
		{
			id: '4',
			name: 'Jens Wolf',
			subtitle: 'Verwaltung · Stadt Osnabrück',
			initials: 'JW',
			lastMessage: 'Die Nebenkostenabrechnung ist genehmigt.',
			lastTime: 'Mo',
			unread: 0,
			online: false,
			messages: [
				{ from: 'me', text: 'Anbei die Nebenkostenabrechnung für 2025.', time: 'Mo 08:30' },
				{ from: 'them', text: 'Die Nebenkostenabrechnung ist genehmigt.', time: 'Mo 14:20' }
			]
		}
	];
</script>

<NachrichtenView {contacts} />
