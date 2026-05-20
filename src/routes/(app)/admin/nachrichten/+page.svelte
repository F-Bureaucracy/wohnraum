<script lang="ts">
	import NachrichtenView, { type Contact } from '$lib/components/nachrichten-view.svelte';

	const contacts: Contact[] = [
		{
			id: '1',
			name: 'Klaus Hoffmann',
			subtitle: 'Goethestraße 14, Berlin',
			initials: 'KH',
			lastMessage: 'Die Nebenkostenabrechnung sende ich Ihnen morgen zu.',
			lastTime: '09:42',
			unread: 2,
			online: true,
			messages: [
				{ from: 'them', text: 'Guten Morgen Frau Müller!', time: '09:30' },
				{
					from: 'them',
					text: 'Ich wollte mich kurz wegen der Nebenkostenabrechnung melden.',
					time: '09:31'
				},
				{ from: 'me', text: 'Guten Morgen Herr Hoffmann, gerne.', time: '09:35' },
				{ from: 'me', text: 'Wann darf ich damit rechnen?', time: '09:35' },
				{
					from: 'them',
					text: 'Die Nebenkostenabrechnung sende ich Ihnen morgen zu.',
					time: '09:42'
				}
			]
		},
		{
			id: '2',
			name: 'Sabine Wagner',
			subtitle: 'Lindenallee 7, München',
			initials: 'SW',
			lastMessage: 'Danke, der Handwerker kommt am Donnerstag.',
			lastTime: 'Gestern',
			unread: 0,
			online: false,
			messages: [
				{ from: 'me', text: 'Die Heizung im Wohnzimmer funktioniert nicht.', time: 'Gestern 14:02' },
				{
					from: 'them',
					text: 'Oh, das tut mir leid. Ich kümmere mich sofort darum.',
					time: 'Gestern 14:18'
				},
				{ from: 'them', text: 'Danke, der Handwerker kommt am Donnerstag.', time: 'Gestern 16:05' }
			]
		},
		{
			id: '3',
			name: 'Dr. Thomas Becker',
			subtitle: 'Hafenweg 22, Hamburg',
			initials: 'TB',
			lastMessage: 'Bitte unterschreiben Sie den neuen Mietvertrag.',
			lastTime: 'Di',
			unread: 1,
			online: true,
			messages: [
				{ from: 'them', text: 'Hallo, anbei der überarbeitete Mietvertrag.', time: 'Di 10:00' },
				{ from: 'them', text: 'Bitte unterschreiben Sie den neuen Mietvertrag.', time: 'Di 10:01' }
			]
		},
		{
			id: '4',
			name: 'Maria Schulz',
			subtitle: 'Rosenweg 3, Köln',
			initials: 'MS',
			lastMessage: 'Schönen Sonntag noch!',
			lastTime: 'So',
			unread: 0,
			online: false,
			messages: [
				{ from: 'me', text: 'Die Miete ist überwiesen.', time: 'So 11:00' },
				{ from: 'them', text: 'Vielen Dank, ist angekommen.', time: 'So 11:30' },
				{ from: 'them', text: 'Schönen Sonntag noch!', time: 'So 11:30' }
			]
		},
		{
			id: '5',
			name: 'Jörg Brandt',
			subtitle: 'Schillerplatz 9, Leipzig',
			initials: 'JB',
			lastMessage: 'Ich melde mich nächste Woche wegen der Besichtigung.',
			lastTime: '12.05.',
			unread: 0,
			online: false,
			messages: [
				{
					from: 'them',
					text: 'Ich melde mich nächste Woche wegen der Besichtigung.',
					time: '12.05. 17:20'
				}
			]
		},
		{
			id: '6',
			name: 'Elena Petrova',
			subtitle: 'Mozartstraße 18, Dresden',
			initials: 'EP',
			lastMessage: 'Können wir den Termin verschieben?',
			lastTime: '08.05.',
			unread: 0,
			online: true,
			messages: [
				{ from: 'them', text: 'Können wir den Termin verschieben?', time: '08.05. 13:14' }
			]
		}
	];
</script>

<NachrichtenView {contacts} />
