const {
  Client,
  GatewayIntentBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField
} = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const PANEL_CHANNEL_ID = process.env.TICKET_CHANNEL_ID;
const SUPPORT_ROLE = process.env.SUPPORT_ROLE_ID;

const CATEGORY_MAP = {
  general_support: process.env.CATEGORY_GENERAL,
  billing_support: process.env.CATEGORY_BILLING,
  player_reports: process.env.CATEGORY_PLAYER,
  staff_reports: process.env.CATEGORY_STAFF,
  bug_reports: process.env.CATEGORY_BUG,
  connection_issues: process.env.CATEGORY_CONNECTION
};

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
    const selected = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${selected}`)
      .setTitle('Help us understand your issue');

    const questions = {
      general_support: [
        ['general_reason', 'Briefly describe your issue', TextInputStyle.Paragraph]
      ],
      billing_support: [
        ['billing_id', 'Your Transaction ID', TextInputStyle.Short],
        ['billing_problem', 'Describe the issue', TextInputStyle.Paragraph]
      ],
      player_reports: [
        ['player_name', 'Player username/tag', TextInputStyle.Short],
        ['player_reason', 'Reason for report', TextInputStyle.Paragraph]
      ],
      staff_reports: [
        ['staff_name', 'Staff name or role', TextInputStyle.Short],
        ['staff_reason', 'Describe the incident', TextInputStyle.Paragraph]
      ],
      bug_reports: [
        ['bug_summary', 'What bug did you find?', TextInputStyle.Paragraph]
      ],
      connection_issues: [
        ['connection_problem', 'Describe the issue you’re facing', TextInputStyle.Paragraph]
      ]
    };

    const inputs = questions[selected].map(([id, label, style]) =>
      new TextInputBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(style)
        .setRequired(true)
    );

    const rows = inputs.map(input => new ActionRowBuilder().addComponents(input));
    modal.addComponents(...rows);

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
    const categoryKey = interaction.customId.replace('ticket_modal_', '');
    const categoryId = CATEGORY_MAP[categoryKey];

    const channel = await interaction.guild.channels.create({
      name: `${categoryKey}-${interaction.user.username}`,
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
    });

    const fields = interaction.fields.fields.map(f => `**${f.customId.replace(/_/g, ' ')}**:\n${f.value}`).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('📩 New Ticket Opened')
      .setDescription(`Opened by: <@${interaction.user.id}>\n\n${fields}`)
      .setFooter({ text: '© All Rights Reserved by Spacaso Zone' });

    const mention = `<@&${SUPPORT_ROLE}>`;
    let ticketMessage = '';

    switch (categoryKey) {
      case 'general_support':
        ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for opening a **General Support** ticket. One of our team members ${mention} will respond when they're next available!\nThank you for your patience.`;
        break;
      case 'billing_support':
        ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for opening a **Billing Support** ticket. ${mention} will assist you shortly with your billing-related issue.`;
        break;
      case 'player_reports':
        ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for reporting a player. Please provide evidence or describe the incident and ${mention} will investigate.`;
        break;
      case 'staff_reports':
        ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for submitting a staff report. Please provide evidence and details — ${mention} will review your report shortly.`;
        break;
      case 'bug_reports':
        ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for reporting a bug. ${mention} will review the issue and forward it to the dev team if needed.`;
        break;
      case 'connection_issues':
        ticketMessage = `Hey <@${interaction.user.id}> 👋\n\nThanks for reporting a connection issue. ${mention} will investigate and help you as soon as possible.`;
        break;
      default:
        ticketMessage = `Hey <@${interaction.user.id}> — thank you for your ticket. Our team ${mention} will respond shortly.`;
        break;
    }

    await channel.send({ content: ticketMessage });
    await channel.send({ content: mention, embeds: [embed] });

    await interaction.reply({
      content: `✅ Your ticket has been opened: ${channel}`,
      ephemeral: true
    });
  }
});

client.on('ready', async () => {
  const panelChannel = await client.channels.fetch(PANEL_CHANNEL_ID);

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
    .setPlaceholder('Choose a support category')
    .addOptions(
      {
        label: '📁 General Support',
        value: 'general_support',
        description: 'Questions or issues not tied to a specific category.'
      },
      {
        label: '💳 Billing Support',
        value: 'billing_support',
        description: 'Help with payments, purchases, or transaction issues.'
      },
      {
        label: '👤 Player Reports',
        value: 'player_reports',
        description: 'Report rule-breaking, harassment, or unfair behavior.'
      },
      {
        label: '🛡️ Staff Reports',
        value: 'staff_reports',
        description: 'Report misconduct or abuse by a staff member.'
      },
      {
        label: '🐞 Bug Reports',
        value: 'bug_reports',
        description: 'Found a glitch or bug? Let us know here.'
      },
      {
        label: '🌐 Connection Issues',
        value: 'connection_issues',
        description: 'Report lag, disconnections, or access problems.'
      }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await panelChannel.send({ embeds: [infoEmbed], components: [row] });
});

client.login(process.env.BOT_TOKEN);

