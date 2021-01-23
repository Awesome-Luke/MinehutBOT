import { Listener } from 'discord-akairo';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { guildConfigs } from '../guild/config/guildConfigs';
import { MessageEmbed } from 'discord.js';
import { generateHastebinFromInput } from '../util/functions';

export default class HastebinConversionListener extends Listener {
	constructor() {
		super('hastebinConversion', {
			emitter: 'client',
			event: 'message',
		});
	}

	async exec(msg: Message) {
		if (!msg.guild) return;

		const hastebinConversionConfig = guildConfigs.get(msg.guild.id)?.features
			.hastebinConversion;
		if (
			!hastebinConversionConfig ||
			hastebinConversionConfig.ignoredChannels?.includes(msg.channel.id)
		)
			return;

		const messageAttachment = msg.attachments.find(attachment =>
			hastebinConversionConfig.whitelistedExtensions.some(ext =>
				attachment.name?.endsWith(`.${ext}`)
			)
		);
		if (!messageAttachment) return;

		if (this.client.hastebinCooldownManager.isOnCooldown(msg.author.id))
			return msg.react('⏲️');

		const res = await fetch(messageAttachment.url);
		const text = await res.text();

		const hastebinUrl = await generateHastebinFromInput(
			text,
			messageAttachment.name?.substring(
				messageAttachment.name.indexOf('.') + 1
			)!
		);
		const embed = new MessageEmbed()
			.setDescription(`__[View ${messageAttachment.name || "attachment"} on hastebin](${hastebinUrl})__.`)
			.setFooter(`Requested by ${msg.author.tag}`, msg.author.avatarURL()!)
			.setColor('BLUE');
		await msg.channel.send(embed);
		this.client.hastebinCooldownManager.add(msg.author.id);
	}
}
