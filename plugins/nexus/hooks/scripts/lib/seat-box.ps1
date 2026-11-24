# The box keeper for lib/seat-box.js. Windows PowerShell 5.1; the box itself is the inline C# below, compiled
# by Add-Type at each start, since the plugin ships no binaries. Started only through seat-box.js, which reads
# this file as text into a script block, so no execution policy applies to it.
#
#   -Mode run   -Box <box folder>   runs the job request.json describes inside a job object named
#                                   Local\nexus-box-{box id}; writes status.json and events.jsonl
#   -Mode check -Arg <base64 JSON>  {boxId, members}: whether that job object still opens, and for each member
#                                   whether it lives by pid and creation time
#   -Mode kill  -Arg <base64 JSON>  {pid, created}: ends that process through one handle, only on a match
param([string]$Mode = 'run', [string]$Box = '', [string]$Arg = '')
$ErrorActionPreference = 'Stop'

$source = @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using Microsoft.Win32.SafeHandles;

namespace NexusSeatBox {
  public static class Keeper {
    [StructLayout(LayoutKind.Sequential)]
    struct BASIC {
      public long PerProcessUserTimeLimit; public long PerJobUserTimeLimit; public uint LimitFlags;
      public UIntPtr MinimumWorkingSetSize; public UIntPtr MaximumWorkingSetSize; public uint ActiveProcessLimit;
      public UIntPtr Affinity; public uint PriorityClass; public uint SchedulingClass;
    }
    [StructLayout(LayoutKind.Sequential)]
    struct IOC { public ulong a; public ulong b; public ulong c; public ulong d; public ulong e; public ulong f; }
    [StructLayout(LayoutKind.Sequential)]
    struct EXT {
      public BASIC Basic; public IOC Io; public UIntPtr ProcessMemoryLimit; public UIntPtr JobMemoryLimit;
      public UIntPtr PeakProcessMemoryUsed; public UIntPtr PeakJobMemoryUsed;
    }
    [StructLayout(LayoutKind.Sequential)]
    struct SECURITY_ATTRIBUTES { public int nLength; public IntPtr lpSecurityDescriptor; public bool bInheritHandle; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct STARTUPINFO {
      public int cb; public string lpReserved; public string lpDesktop; public string lpTitle;
      public int dwX; public int dwY; public int dwXSize; public int dwYSize; public int dwXCountChars;
      public int dwYCountChars; public int dwFillAttribute; public int dwFlags; public short wShowWindow;
      public short cbReserved2; public IntPtr lpReserved2; public IntPtr hStdInput; public IntPtr hStdOutput;
      public IntPtr hStdError;
    }
    [StructLayout(LayoutKind.Sequential)]
    struct PROCESS_INFORMATION { public IntPtr hProcess; public IntPtr hThread; public int dwProcessId; public int dwThreadId; }

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr CreateJobObject(IntPtr attributes, string name);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr OpenJobObject(uint access, bool inherit, string name);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool SetInformationJobObject(IntPtr job, int infoClass, ref EXT info, int length);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool QueryInformationJobObject(IntPtr job, int infoClass, IntPtr buffer, int length, out int returned);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool TerminateJobObject(IntPtr job, uint exitCode);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CreatePipe(out IntPtr read, out IntPtr write, ref SECURITY_ATTRIBUTES attributes, int size);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool SetHandleInformation(IntPtr handle, int mask, int flags);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool CreateProcess(string application, StringBuilder commandLine, IntPtr processAttributes,
      IntPtr threadAttributes, bool inheritHandles, uint flags, IntPtr environment, string directory,
      ref STARTUPINFO startup, out PROCESS_INFORMATION info);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool TerminateProcess(IntPtr process, uint exitCode);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool GetExitCodeProcess(IntPtr process, out uint exitCode);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool GetProcessTimes(IntPtr process, out long created, out long exited, out long kernel, out long user);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool QueryFullProcessImageName(IntPtr process, int flags, StringBuilder name, ref int size);
    [DllImport("kernel32.dll")]
    static extern int GetCurrentProcessId();
    [DllImport("kernel32.dll")]
    static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool ProcessIdToSessionId(int pid, out int session);
    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool OpenProcessToken(IntPtr process, uint access, out IntPtr token);
    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool GetTokenInformation(IntPtr token, int infoClass, IntPtr buffer, int length, out int returned);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool MoveFileEx(string from, string to, int flags);

    const uint CREATE_SUSPENDED = 0x4;
    const uint CREATE_NO_WINDOW = 0x08000000;
    const int STARTF_USESTDHANDLES = 0x100;
    const uint KILL_ON_JOB_CLOSE = 0x2000;
    const uint QUERY_LIMITED = 0x1000;
    const uint TERMINATE = 0x1;
    const uint JOB_QUERY = 0x4;
    const uint STILL_ACTIVE = 259;

    static readonly UTF8Encoding Utf8 = new UTF8Encoding(false);
    static readonly JavaScriptSerializer Ser = NewSerializer();

    static JavaScriptSerializer NewSerializer() {
      JavaScriptSerializer s = new JavaScriptSerializer();
      s.MaxJsonLength = int.MaxValue;
      return s;
    }

    static string Now() { return DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture); }

    // The form .NET's Process.StartTime takes, made universal, so a lookup through Get-Process compares equal.
    static string Stamp(long fileTime) { return DateTime.FromFileTime(fileTime).ToUniversalTime().ToString("o", CultureInfo.InvariantCulture); }

    static string CreatedOf(IntPtr process) {
      long created, exited, kernel, user;
      return GetProcessTimes(process, out created, out exited, out kernel, out user) ? Stamp(created) : null;
    }

    static string NameOf(IntPtr process) {
      StringBuilder name = new StringBuilder(1024);
      int size = name.Capacity;
      return QueryFullProcessImageName(process, 0, name, ref size) ? Path.GetFileName(name.ToString()) : null;
    }

    static string LogonId() {
      IntPtr token;
      if (!OpenProcessToken(GetCurrentProcess(), 0x8, out token)) return null;
      IntPtr buffer = Marshal.AllocHGlobal(256);
      try {
        int returned;
        if (!GetTokenInformation(token, 10, buffer, 256, out returned)) return null;
        return "0x" + Marshal.ReadInt64(buffer, 8).ToString("x", CultureInfo.InvariantCulture);
      } finally {
        Marshal.FreeHGlobal(buffer);
        CloseHandle(token);
      }
    }

    static Dictionary<string, object> KeeperFacts() {
      Dictionary<string, object> k = new Dictionary<string, object>();
      int pid = GetCurrentProcessId();
      int session;
      k["pid"] = pid;
      k["created"] = CreatedOf(GetCurrentProcess());
      k["session"] = ProcessIdToSessionId(pid, out session) ? (object)session : null;
      k["logonId"] = LogonId();
      return k;
    }

    static List<object> Members(IntPtr job) {
      List<object> list = new List<object>();
      int size = 8 + 8 * 4096;
      IntPtr buffer = Marshal.AllocHGlobal(size);
      try {
        int returned;
        if (!QueryInformationJobObject(job, 3, buffer, size, out returned)) return list;
        int count = Marshal.ReadInt32(buffer, 4);
        for (int i = 0; i < count; i++) {
          int pid = (int)Marshal.ReadIntPtr(buffer, 8 + i * IntPtr.Size).ToInt64();
          Dictionary<string, object> m = new Dictionary<string, object>();
          m["pid"] = pid;
          m["created"] = null;
          m["name"] = null;
          IntPtr h = OpenProcess(QUERY_LIMITED, false, pid);
          if (h != IntPtr.Zero) {
            m["created"] = CreatedOf(h);
            m["name"] = NameOf(h);
            CloseHandle(h);
          }
          list.Add(m);
        }
      } finally {
        Marshal.FreeHGlobal(buffer);
      }
      return list;
    }

    // JOBOBJECT_BASIC_ACCOUNTING_INFORMATION: the query takes its exact size, 48 bytes; ActiveProcesses is at 40.
    static int ActiveCount(IntPtr job) {
      IntPtr buffer = Marshal.AllocHGlobal(48);
      try {
        int returned;
        if (QueryInformationJobObject(job, 1, buffer, 48, out returned)) return Marshal.ReadInt32(buffer, 40);
      } finally {
        Marshal.FreeHGlobal(buffer);
      }
      return ListedCount(job);
    }

    static int ListedCount(IntPtr job) {
      int size = 8 + 8 * 4096;
      IntPtr buffer = Marshal.AllocHGlobal(size);
      try {
        int returned;
        if (!QueryInformationJobObject(job, 3, buffer, size, out returned)) return -1;
        return Marshal.ReadInt32(buffer, 0);
      } finally {
        Marshal.FreeHGlobal(buffer);
      }
    }

    static void WriteJson(string file, object value) {
      string tmp = file + ".tmp";
      File.WriteAllText(tmp, Ser.Serialize(value), Utf8);
      int error = 0;
      for (int i = 0; i < 40; i++) {
        if (MoveFileEx(tmp, file, 1)) return;
        error = Marshal.GetLastWin32Error();
        Thread.Sleep(50);
      }
      Console.Error.WriteLine(Now() + " the status could not be written to " + file + " (error " + error + ")");
    }

    static int Early(string file, Dictionary<string, object> status, string reason) {
      status["state"] = "failed";
      status["launched"] = false;
      status["reason"] = reason;
      status["endedAt"] = Now();
      WriteJson(file, status);
      return 1;
    }

    static string Field(Dictionary<string, object> d, string key) {
      object v;
      return d != null && d.TryGetValue(key, out v) ? v as string : null;
    }

    // Reads one JSONL line into the status; returns the state the job ends in, or null.
    static string ReadEvent(string line, Dictionary<string, object> status) {
      Dictionary<string, object> ev = null;
      try { ev = Ser.DeserializeObject(line) as Dictionary<string, object>; } catch (Exception) { return null; }
      string type = Field(ev, "type");
      if (type == null) return null;
      status["lastEventAt"] = Now();
      object inner;
      if (type == "thread.started") {
        string id = Field(ev, "thread_id");
        if (id != null) status["thread"] = id;
      } else if (type == "item.completed") {
        Dictionary<string, object> item = ev.TryGetValue("item", out inner) ? inner as Dictionary<string, object> : null;
        if (Field(item, "type") == "agent_message" && Field(item, "text") != null) status["output"] = Field(item, "text");
      } else if (type == "error") {
        string message = Field(ev, "message");
        if (message != null) status["reason"] = message;
      } else if (type == "turn.completed") {
        return "completed";
      } else if (type == "turn.failed") {
        Dictionary<string, object> err = ev.TryGetValue("error", out inner) ? inner as Dictionary<string, object> : null;
        string message = Field(err, "message");
        if (message != null) status["reason"] = message;
        return "failed";
      }
      return null;
    }

    static Thread LineReader(IntPtr handle, List<string> sink, object gate, bool[] done) {
      Thread t = new Thread(delegate() {
        try {
          using (StreamReader reader = new StreamReader(new FileStream(new SafeFileHandle(handle, true), FileAccess.Read, 4096, false), Utf8)) {
            string line;
            while ((line = reader.ReadLine()) != null) { lock (gate) { sink.Add(line); } }
          }
        } catch (Exception) { }
        lock (gate) { done[0] = true; }
      });
      t.IsBackground = true;
      t.Start();
      return t;
    }

    static List<string> Take(List<string> sink, object gate) {
      lock (gate) {
        List<string> batch = new List<string>(sink);
        sink.Clear();
        return batch;
      }
    }

    static void Append(string file, List<string> lines) {
      if (lines.Count == 0) return;
      StringBuilder sb = new StringBuilder();
      foreach (string l in lines) sb.Append(l).Append('\n');
      File.AppendAllText(file, sb.ToString(), Utf8);
    }

    public static int Run(string box) {
      string statusFile = Path.Combine(box, "status.json");
      Dictionary<string, object> status = new Dictionary<string, object>();
      status["boxId"] = Path.GetFileName(box);
      status["launched"] = false;
      IntPtr job = IntPtr.Zero;
      PROCESS_INFORMATION pi = new PROCESS_INFORMATION();
      bool launched = false;
      try {
        Dictionary<string, object> req = (Dictionary<string, object>)Ser.DeserializeObject(File.ReadAllText(Path.Combine(box, "request.json"), Utf8));
        string boxId = Field(req, "boxId");
        string kind = Field(req, "kind");
        string promptFile = Field(req, "promptFile");
        object limitRaw;
        double limitMs = req.TryGetValue("limitMs", out limitRaw) && limitRaw != null ? Convert.ToDouble(limitRaw, CultureInfo.InvariantCulture) : 0;
        status["boxId"] = boxId;
        status["kind"] = kind;
        status["tree"] = Field(req, "tree");
        status["keeper"] = KeeperFacts();
        bool direct = Field(req, "route") == "direct";
        if (direct) {
          string holder = Path.Combine(box, "holder.json");
          string claimFile = Path.Combine(box, "claim");
          Stopwatch wait = Stopwatch.StartNew();
          while (!File.Exists(holder)) {
            if (File.Exists(claimFile) || wait.ElapsedMilliseconds >= 60000)
              return Early(statusFile, status, "the box's holder was not recorded before launch");
            Thread.Sleep(100);
          }
        }

        job = CreateJobObject(IntPtr.Zero, "Local\\nexus-box-" + boxId);
        if (job == IntPtr.Zero) return Early(statusFile, status, "the box's job object could not be made (error " + Marshal.GetLastWin32Error() + ")");
        if (Marshal.GetLastWin32Error() == 183) {
          CloseHandle(job);
          job = IntPtr.Zero;
          return Early(statusFile, status, "a job object named for this box already exists");
        }
        EXT ext = new EXT();
        ext.Basic.LimitFlags = KILL_ON_JOB_CLOSE;
        if (!SetInformationJobObject(job, 9, ref ext, Marshal.SizeOf(typeof(EXT)))) {
          return Early(statusFile, status, "the box's job object could not be set to end its processes when closed (error " + Marshal.GetLastWin32Error() + ")");
        }

        try {
          using (FileStream claim = new FileStream(Path.Combine(box, "claim"), FileMode.CreateNew, FileAccess.Write)) {
            byte[] word = Utf8.GetBytes(direct ? "launch\n" + Ser.Serialize(status["keeper"]) : "launch");
            claim.Write(word, 0, word.Length);
          }
        } catch (IOException) {
          return Early(statusFile, status, "the job's start gave it up before it launched");
        }

        SECURITY_ATTRIBUTES sa = new SECURITY_ATTRIBUTES();
        sa.nLength = Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES));
        sa.bInheritHandle = true;
        IntPtr inR = IntPtr.Zero, inW = IntPtr.Zero, outR = IntPtr.Zero, outW = IntPtr.Zero, errR = IntPtr.Zero, errW = IntPtr.Zero;
        if (!CreatePipe(out inR, out inW, ref sa, 0)) return Early(statusFile, status, "the job's input pipe could not be made");
        if (!CreatePipe(out outR, out outW, ref sa, 0)) return Early(statusFile, status, "the job's output pipe could not be made");
        if (!CreatePipe(out errR, out errW, ref sa, 0)) return Early(statusFile, status, "the job's error pipe could not be made");
        SetHandleInformation(inW, 1, 0);
        SetHandleInformation(outR, 1, 0);
        SetHandleInformation(errR, 1, 0);

        STARTUPINFO si = new STARTUPINFO();
        si.cb = Marshal.SizeOf(typeof(STARTUPINFO));
        si.dwFlags = STARTF_USESTDHANDLES;
        si.hStdInput = inR;
        si.hStdOutput = outW;
        si.hStdError = errW;
        StringBuilder commandLine = new StringBuilder(Field(req, "commandLine"));
        if (!CreateProcess(Field(req, "application"), commandLine, IntPtr.Zero, IntPtr.Zero, true, CREATE_SUSPENDED | CREATE_NO_WINDOW,
            IntPtr.Zero, Field(req, "cwd"), ref si, out pi)) {
          return Early(statusFile, status, "the job's process could not be created (error " + Marshal.GetLastWin32Error() + ")");
        }
        if (!AssignProcessToJobObject(job, pi.hProcess)) {
          int err = Marshal.GetLastWin32Error();
          TerminateProcess(pi.hProcess, 1);
          CloseHandle(pi.hThread);
          CloseHandle(pi.hProcess);
          pi = new PROCESS_INFORMATION();
          return Early(statusFile, status, "the job's process could not be put in the box (error " + err + ")");
        }
        ResumeThread(pi.hThread);
        CloseHandle(pi.hThread);
        CloseHandle(inR);
        CloseHandle(outW);
        CloseHandle(errW);
        launched = true;

        Dictionary<string, object> proc = new Dictionary<string, object>();
        proc["pid"] = pi.dwProcessId;
        proc["created"] = CreatedOf(pi.hProcess);
        status["launched"] = true;
        status["process"] = proc;
        status["state"] = "running";
        status["startedAt"] = Now();
        status["lastEventAt"] = null;
        status["thread"] = null;
        status["output"] = null;
        status["reason"] = null;
        status["members"] = Members(job);
        WriteJson(statusFile, status);

        byte[] prompt = promptFile != null ? File.ReadAllBytes(promptFile) : new byte[0];
        IntPtr stdin = inW;
        Thread feeder = new Thread(delegate() {
          try {
            using (FileStream s = new FileStream(new SafeFileHandle(stdin, true), FileAccess.Write, 4096, false)) {
              if (prompt.Length > 0) s.Write(prompt, 0, prompt.Length);
            }
          } catch (Exception) { }
        });
        feeder.IsBackground = true;
        feeder.Start();

        object gate = new object();
        List<string> lines = new List<string>();
        List<string> errLines = new List<string>();
        bool[] outDone = new bool[1];
        bool[] errDone = new bool[1];
        Thread outReader = LineReader(outR, lines, gate, outDone);
        Thread errReader = LineReader(errR, errLines, gate, errDone);

        string events = Path.Combine(box, kind == "codex" ? "events.jsonl" : "output.log");
        string errLog = Path.Combine(box, "stderr.log");
        string cutFile = Path.Combine(box, "cut.request");
        string lastErr = null;
        string ending = null;
        bool exited = false;
        uint exitCode = 0;
        DateTime exitedAt = DateTime.MinValue;
        DateTime lastRefresh = DateTime.UtcNow;
        DateTime lastCut = DateTime.UtcNow;
        DateTime launchedAt = DateTime.UtcNow;

        while (ending == null) {
          List<string> batch = Take(lines, gate);
          List<string> errBatch = Take(errLines, gate);
          if (errBatch.Count > 0) {
            Append(errLog, errBatch);
            for (int i = errBatch.Count - 1; i >= 0; i--) { if (errBatch[i].Trim().Length > 0) { lastErr = errBatch[i].Trim(); break; } }
          }
          if (batch.Count > 0) {
            Append(events, batch);
            if (kind == "codex") {
              foreach (string l in batch) {
                string end = ReadEvent(l, status);
                if (end != null && ending == null) ending = end;
              }
            }
            status["members"] = Members(job);
            lastRefresh = DateTime.UtcNow;
            WriteJson(statusFile, status);
            if (ending != null) break;
          }
          if (!exited && WaitForSingleObject(pi.hProcess, 0) == 0) {
            exited = true;
            GetExitCodeProcess(pi.hProcess, out exitCode);
            exitedAt = DateTime.UtcNow;
          }
          if (exited) {
            bool drained;
            lock (gate) { drained = outDone[0] && lines.Count == 0; }
            bool pending;
            lock (gate) { pending = lines.Count > 0; }
            if (!pending && (drained || (DateTime.UtcNow - exitedAt).TotalMilliseconds > 1500)) {
              status["exitCode"] = (long)exitCode;
              if (kind == "codex") {
                string why = "the job's process exited (code " + exitCode + ") with neither turn.completed nor turn.failed";
                if (status["reason"] != null) why += "; last error event: " + status["reason"];
                else if (lastErr != null) why += "; last error output: " + lastErr;
                status["reason"] = why;
                ending = "failed";
              } else {
                ending = "completed";
              }
              break;
            }
          }
          if ((DateTime.UtcNow - lastCut).TotalSeconds >= 2) {
            lastCut = DateTime.UtcNow;
            if (File.Exists(cutFile)) {
              ending = "cancelled";
              status["reason"] = "the job was cut";
              break;
            }
          }
          if (limitMs > 0 && (DateTime.UtcNow - launchedAt).TotalMilliseconds >= limitMs) {
            ending = "cancelled";
            status["reason"] = "the job ran past its limit of " + Math.Round(limitMs / 1000) + " s";
            status["limitReached"] = true;
            break;
          }
          if ((DateTime.UtcNow - lastRefresh).TotalSeconds >= 10) {
            status["members"] = Members(job);
            lastRefresh = DateTime.UtcNow;
            WriteJson(statusFile, status);
          }
          Thread.Sleep(200);
        }

        status["state"] = ending;
        status["endedAt"] = Now();
        status["members"] = Members(job);
        WriteJson(statusFile, status);
        if (!exited && ending != "cancelled") WaitForSingleObject(pi.hProcess, 15000);
        if (!exited && WaitForSingleObject(pi.hProcess, 0) == 0) {
          exited = true;
          GetExitCodeProcess(pi.hProcess, out exitCode);
          status["exitCode"] = (long)exitCode;
        }
        Close(job, status, statusFile, outReader, errReader, lines, errLines, gate, events, errLog);
        return 0;
      } catch (Exception ex) {
        if (!launched) {
          try { return Early(statusFile, status, "the keeper failed before the job started: " + ex.Message); } catch (Exception) { return 1; }
        }
        try {
          status["state"] = "failed";
          status["reason"] = "the keeper failed: " + ex.Message;
          status["endedAt"] = Now();
          Close(job, status, statusFile, null, null, null, null, null, null, null);
        } catch (Exception) { }
        return 1;
      } finally {
        if (pi.hProcess != IntPtr.Zero) CloseHandle(pi.hProcess);
        if (job != IntPtr.Zero) CloseHandle(job);
      }
    }

    // Records what is still in the box, ends it, and writes boxClosed only once no process is left in it.
    static void Close(IntPtr job, Dictionary<string, object> status, string statusFile, Thread outReader, Thread errReader,
        List<string> lines, List<string> errLines, object gate, string events, string errLog) {
      status["leftovers"] = Members(job);
      TerminateJobObject(job, 1);
      DateTime from = DateTime.UtcNow;
      bool closed = false;
      while ((DateTime.UtcNow - from).TotalSeconds < 60) {
        if (ActiveCount(job) == 0) { closed = true; break; }
        Thread.Sleep(100);
      }
      if (outReader != null) outReader.Join(2000);
      if (errReader != null) errReader.Join(1000);
      if (lines != null) Append(events, Take(lines, gate));
      if (errLines != null) Append(errLog, Take(errLines, gate));
      status["members"] = Members(job);
      status["boxClosed"] = closed;
      if (closed) status["boxClosedAt"] = Now();
      else status["closeReason"] = "processes were still in the box 60 s after it was ended";
      WriteJson(statusFile, status);
    }

    static object Decode(string arg) { return Ser.DeserializeObject(Utf8.GetString(Convert.FromBase64String(arg))); }

    static string AliveOne(int pid, string created) {
      IntPtr h = OpenProcess(QUERY_LIMITED, false, pid);
      if (h == IntPtr.Zero) return Marshal.GetLastWin32Error() == 87 ? "gone" : "unknown";
      try {
        string now = CreatedOf(h);
        if (now == null) return "unknown";
        if (created != null && now != created) return "gone";
        uint code;
        if (GetExitCodeProcess(h, out code) && code != STILL_ACTIVE) return "gone";
        return "alive";
      } finally {
        CloseHandle(h);
      }
    }

    public static string Check(string arg) {
      Dictionary<string, object> input = (Dictionary<string, object>)Decode(arg);
      Dictionary<string, object> result = new Dictionary<string, object>();
      IntPtr job = OpenJobObject(JOB_QUERY, false, "Local\\nexus-box-" + Field(input, "boxId"));
      if (job != IntPtr.Zero) {
        result["job"] = "yes";
        CloseHandle(job);
      } else {
        result["job"] = Marshal.GetLastWin32Error() == 2 ? "no" : "unknown";
      }
      List<object> members = new List<object>();
      object raw;
      object[] given = input.TryGetValue("members", out raw) ? raw as object[] : null;
      if (given != null) {
        foreach (object o in given) {
          Dictionary<string, object> m = o as Dictionary<string, object>;
          if (m == null || !m.ContainsKey("pid")) continue;
          int pid = Convert.ToInt32(m["pid"], CultureInfo.InvariantCulture);
          string created = Field(m, "created");
          Dictionary<string, object> r = new Dictionary<string, object>();
          r["pid"] = pid;
          r["created"] = created;
          r["state"] = AliveOne(pid, created);
          members.Add(r);
        }
      }
      result["members"] = members;
      return Ser.Serialize(result);
    }

    public static string Kill(string arg) {
      Dictionary<string, object> input = (Dictionary<string, object>)Decode(arg);
      int pid = Convert.ToInt32(input["pid"], CultureInfo.InvariantCulture);
      string created = Field(input, "created");
      string result;
      IntPtr h = OpenProcess(TERMINATE | QUERY_LIMITED, false, pid);
      if (h == IntPtr.Zero) {
        result = Marshal.GetLastWin32Error() == 87 ? "gone" : "unknown";
      } else {
        try {
          string now = CreatedOf(h);
          if (now == null) result = "unknown";
          else if (created == null || now != created) result = "mismatch";
          else result = TerminateProcess(h, 1) ? "killed" : "unknown";
        } finally {
          CloseHandle(h);
        }
      }
      return Ser.Serialize(result);
    }
  }
}
'@

function Write-EarlyFailure([string]$Reason) {
  if ($Mode -ne 'run' -or $Box -eq '') { return }
  $file = Join-Path $Box 'status.json'
  $json = @{ boxId = (Split-Path -Leaf $Box); state = 'failed'; launched = $false; reason = $Reason; endedAt = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json -Compress
  Set-Content -LiteralPath ($file + '.tmp') -Value $json -Encoding Ascii -NoNewline
  Move-Item -LiteralPath ($file + '.tmp') -Destination $file -Force
}

try {
  Add-Type -AssemblyName System.Web.Extensions
  $serializer = [System.Web.Script.Serialization.JavaScriptSerializer].Assembly.Location
  Add-Type -TypeDefinition $source -Language CSharp -ReferencedAssemblies $serializer -IgnoreWarnings
} catch {
  Write-EarlyFailure ("the keeper's inline C# did not load: " + $_.Exception.Message)
  Write-Output ('error: ' + $_.Exception.Message)
  exit 1
}

switch ($Mode) {
  'run' { [void][NexusSeatBox.Keeper]::Run($Box) }
  'check' { Write-Output ([NexusSeatBox.Keeper]::Check($Arg)) }
  'kill' { Write-Output ([NexusSeatBox.Keeper]::Kill($Arg)) }
  default { Write-Output ('error: unknown mode ' + $Mode); exit 2 }
}
