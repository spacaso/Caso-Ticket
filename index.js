const { Client, GatewayIntentBits, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js')
require('dotenv').config()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const PANEL_CHANNEL_ID = process.env.TICKET_CHANNEL_ID
const SUPPORT_ROLE = process.env.SUPPORT_ROLE_ID

const CATEGORY_MAP = {
  general_support: process.env.CATEGORY_GENERAL,
  billing_support: process.env.CATEGORY_BILLING,
  player_reports: process.env.CATEGORY_PLAYER,
  staff_reports: process.env.CATEGORY_STAFF,
  bug_reports: process.env.CATEGORY_BUG
}

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return
  if (interaction.customId !== 'ticket_select') return

  const selected = interaction.values[0]
  const categoryId = CATEGORY_MAP[selected]

  const channel = await interaction.guild.channels.create({
    name: `${selected}-${interaction.user.username}`,
    type: 0,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: SUPPORT_ROLE,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  })

const mention = `<@&${SUPPORT_ROLE}>`
let ticketMessage = ''

switch (selected) {
  case 'general_support':
    ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for opening a **General Support** ticket. One of our team members ${mention} will respond when they're next available!\nThank you for your patience.`
    break
  case 'billing_support':
    ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for opening a **Billing Support** ticket. ${mention} will assist you shortly with your billing-related issue.`
    break
  case 'player_reports':
    ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for reporting a player. Please provide evidence or describe the incident and ${mention} will investigate.`
    break
  case 'staff_reports':
    ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for submitting a staff report. Please provide evidence and details — ${mention} will review your report shortly.`
    break
  case 'bug_reports':
    ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for reporting a bug. ${mention} will review the issue and forward it to the dev team if needed.`
    break
  default:
    ticketMessage = `Hey <@${interaction.user.id}> — thank you for your ticket. Our team ${mention} will respond shortly.`
    break
}

await channel.send({ content: ticketMessage })


  await interaction.reply({
    content: `✅ Your ticket has been opened: ${channel}`,
    ephemeral: true
  })
})

client.on('ready', async () => {
  const panelChannel = await client.channels.fetch(PANEL_CHANNEL_ID)


  const infoEmbed = new EmbedBuilder()
    .setColor('Yellow')
    .setTitle('📨 | Need Support?')
    .setDescription([
      'Welcome to the support panel. To get assistance, select the appropriate category from the menu below to open a private ticket.\n',

      '📁 **General Support**\nFor general questions or concerns that don’t fit into a specific category.',
      '💳 **Billing Support**\nHelp with payments, purchases, or rewards.',
      '👤 **Player Reports**\nReport rule violations, harassment, or unfair behavior.',
      '🛡️ **Staff Reports**\nConcerns about staff conduct or abuse of power.',
      '🌐 **Connection Issues**\nExperiencing lag, disconnections, or server access problems.',
      '🐞 **Bug Reports**\nFound a glitch or issue? Report it so we can investigate.\n',

      '⚠️ **Please don’t misuse tickets. Spamming or harassing staff may result in penalties.**',
      '✍️ Be as detailed as possible when prompted — it helps us resolve your issue faster.'
    ].join('\n\n'))
    .setFooter({ text: '© All Rights Reserved by Spacaso Zone' });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select')
    .setPlaceholder('Choose a ticket type...')
    .addOptions(
      { label: 'General Support', value: 'general_support' },
      { label: 'Billing Support', value: 'billing_support' },
      { label: 'Player Reports', value: 'player_reports' },
      { label: 'Staff Reports', value: 'staff_reports' },
      { label: 'Bug Reports', value: 'bug_reports' }
    )

  const row = new ActionRowBuilder().addComponents(menu)

  await panelChannel.send({ embeds: [infoEmbed], components: [row] })
})

client.login(process.env.BOT_TOKEN)
